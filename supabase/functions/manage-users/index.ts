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

    const { action, email, password, fullName, role, spiritAnimal, userId } = await req.json()

    if (action === 'create') {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      })

      if (createError) {
        console.error('User creation error:', createError)
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update profile with spirit animal if provided
      if (spiritAnimal && newUser.user) {
        await supabaseAdmin
          .from('profiles')
          .update({ spirit_animal: spiritAnimal })
          .eq('id', newUser.user.id)
      }

      // Assign role
      if (role && newUser.user) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', newUser.user.id)

        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role })
      }

      console.log('User created successfully:', newUser.user?.id)
      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
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