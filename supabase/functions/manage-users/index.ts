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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the JWT token from the Authorization header (automatically passed by supabase.functions.invoke)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'Unauthorized: No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify the JWT properly.
    //
    // This previously base64-decoded the payload and trusted `sub` without ever checking
    // the signature. That was survivable only because config.toml does not list this
    // function, so it inherits verify_jwt = true and the gateway validates the signature
    // before we run. But two other functions in this project already set
    // verify_jwt = false, and the day someone adds that line here, anyone holding the
    // public anon key could forge {"sub": "<any uuid>"} and gain create-user /
    // change-role / deactivate-user. getUser() validates signature and expiry against the
    // auth server, so this no longer depends on a setting in a different file.
    const token = authHeader.replace('Bearer ', '')

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      console.error('JWT verification failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const authenticatedUserId = authData.user.id
    console.log('Authenticated user ID:', authenticatedUserId)

    // Check if user is a PI or manager using the service role client.
    // NOT maybeSingle(): user_roles is UNIQUE(user_id, role), so one person can hold both
    // 'pi' and 'manager'. maybeSingle() errors on multiple rows, which would lock exactly
    // those people out of user management.
    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .in('role', ['pi', 'manager'])

    console.log('Role check - User:', authenticatedUserId, 'Roles:', roleRows, 'Error:', roleError)

    if (roleError || !roleRows || roleRows.length === 0) {
      console.error('Role check failed - Error:', roleError, 'Data:', roleRows)
      return new Response(JSON.stringify({ error: 'Forbidden: PI or Manager access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 'pi' outranks 'manager' wherever the two differ.
    const callerIsPi = roleRows.some((r: { role: string }) => r.role === 'pi')

    const { action, email, fullName, role, spiritAnimal, userId } = await req.json()

    if (action === 'delete') {
      // Same lockout guard as updateRole.
      if (userId === authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'You cannot deactivate your own account.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Soft delete: Set user as inactive instead of hard deleting
      const { error: deactivateError } = await supabaseAdmin
        .from('profiles')
        .update({ active: false })
        .eq('id', userId)

      if (deactivateError) {
        console.error('User deactivation error:', deactivateError)
        return new Response(JSON.stringify({ error: deactivateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Ban the user for 100 years (effectively permanent)
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // 100 years in hours
      })

      if (banError) {
        console.error('User ban error:', banError)
        // Continue even if ban fails - the active flag is the primary control
      }

      // Log activity after successful deactivation
      await supabaseAdmin.from('activity_logs').insert({
        user_id: authenticatedUserId,
        action_type: 'delete',
        entity_type: 'user',
        entity_id: userId,
        entity_name: email || 'User',
        metadata: { action: 'deactivate_user' }
      })

      console.log('User deactivated successfully:', userId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'create') {
      // Generate a random password
      const generatedPassword = crypto.randomUUID()
      
      // Create user directly with password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
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

      if (!newUser.user) {
        console.error('Could not create user')
        return new Response(JSON.stringify({ error: 'User creation failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update profile with spirit animal if provided
      if (spiritAnimal) {
        await supabaseAdmin
          .from('profiles')
          .update({ spirit_animal: spiritAnimal })
          .eq('id', newUser.user.id)
      }

      // Assign role
      if (role) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', newUser.user.id)

        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role })
      }

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        user_id: authenticatedUserId,
        action_type: 'create',
        entity_type: 'user',
        entity_id: newUser.user.id,
        entity_name: fullName || email,
        metadata: { email, role, action: 'create_user' }
      })

      console.log('User created successfully:', newUser.user.id)
      return new Response(JSON.stringify({ success: true, user: newUser.user, password: generatedPassword }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'updateRole') {
      // Guard against locking the lab out of its own admin tools: if the only PI demotes
      // themselves, nobody can manage users or roles ever again.
      if (userId === authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'You cannot change your own role. Ask another PI to do it.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Only a PI may hand out the PI role - otherwise a manager could self-escalate by
      // promoting an account they control.
      if (role === 'pi' && !callerIsPi) {
        return new Response(
          JSON.stringify({ error: 'Only a PI can grant the PI role.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        user_id: authenticatedUserId,
        action_type: 'update',
        entity_type: 'user',
        entity_id: userId,
        entity_name: 'Role Change',
        metadata: { new_role: role, action: 'update_user_role' }
      })

      console.log('Role updated successfully for user:', userId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'reactivate') {
      // Reactivate user: Set active to true
      const { error: reactivateError } = await supabaseAdmin
        .from('profiles')
        .update({ active: true })
        .eq('id', userId)

      if (reactivateError) {
        console.error('User reactivation error:', reactivateError)
        return new Response(JSON.stringify({ error: reactivateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Unban the user by removing the ban duration
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })

      if (unbanError) {
        console.error('User unban error:', unbanError)
        // Continue even if unban fails - the active flag is the primary control
      }

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        user_id: authenticatedUserId,
        action_type: 'update',
        entity_type: 'user',
        entity_id: userId,
        entity_name: email || 'User',
        metadata: { action: 'reactivate_user' }
      })

      console.log('User reactivated successfully:', userId)
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