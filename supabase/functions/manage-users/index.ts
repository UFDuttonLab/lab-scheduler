import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the requesting user is a manager
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is a manager
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('Role check error:', roleError)
      return new Response(JSON.stringify({ error: 'Forbidden: Manager access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, email, fullName, role, spiritAnimal, userId } = await req.json()

    if (action === 'create') {
      // Send invitation email - user will set their own password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName
        },
        redirectTo: `${req.headers.get('origin') || 'http://localhost:8080'}/`
      })

      if (createError) {
        console.error('User invitation error:', createError)
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Wait a moment for the user record to be created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get the user ID from the created user
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
      const createdUser = userData.users.find(u => u.email === email)

      if (!createdUser) {
        console.error('Could not find created user')
        return new Response(JSON.stringify({ error: 'User created but not found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update profile with spirit animal if provided
      if (spiritAnimal) {
        await supabaseAdmin
          .from('profiles')
          .update({ spirit_animal: spiritAnimal })
          .eq('id', createdUser.id)
      }

      // Assign role
      if (role) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', createdUser.id)

        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: createdUser.id, role })
      }

      console.log('User invited successfully:', createdUser.id)
      return new Response(JSON.stringify({ success: true, user: createdUser }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'updateRole') {
      // Update user role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role })

      if (roleInsertError) {
        console.error('Role update error:', roleInsertError)
        return new Response(JSON.stringify({ error: roleInsertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Role updated successfully for user:', userId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in manage-users function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})