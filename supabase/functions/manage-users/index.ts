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

    // `redirectTo` used to be read here and passed to resetPasswordForEmail. The create path
    // no longer sends mail (see the comment in the 'create' branch), so it is deliberately not
    // destructured - an unused allow-list check reads as a live guard when it is not one.
    const { action, email, fullName, role, spiritAnimal, userId } = await req.json()

    if (action === 'delete') {
      // Same lockout guard as updateRole.
      if (userId === authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'You cannot deactivate your own account.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Route through set_user_active: it is transactional, blocks self-deactivation and
      // refuses to deactivate the last active PI. Those guards used to live only here,
      // which meant they could be bypassed with a plain PostgREST update.
      const { error: deactivateError } = await supabaseAdmin.rpc('set_user_active', {
        _target: userId,
        _active: false,
        _actor: authenticatedUserId,
      })

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
      // Only a PI may hand out the PI role. Without this a manager could simply CREATE a
      // brand-new PI account - and receive its password in the response below - which is
      // the same privilege escalation the updateRole guard blocks, just through another door.
      if (role === 'pi' && !callerIsPi) {
        return new Response(
          JSON.stringify({ error: 'Only a PI can create an account with the PI role.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

      // Assign role. The result was previously discarded, so a bad role value produced a
      // user with no role at all and a cheerful success response.
      if (role) {
        const { error: assignError } = await supabaseAdmin.rpc('set_user_role', {
          _target: newUser.user.id,
          _role: role,
          _actor: authenticatedUserId,
        })
        if (assignError) {
          console.error('Role assignment error:', assignError)
          return new Response(
            JSON.stringify({
              error: `User created but role assignment failed: ${assignError.message}`,
              user: newUser.user,
              password: generatedPassword,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
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

      // Hand the PI a set-password LINK rather than mailing one.
      //
      // Until 2026-09-14 this called resetPasswordForEmail() and let Supabase mail the link.
      // That link pointed at GoTrue's /auth/v1/verify endpoint, which spends its one-time
      // token on whoever fetches it FIRST - and corporate mail filters pre-fetch every link in
      // a message. shea.granger@opentrons.com was created 19:56:49, the mail went out
      // 19:56:50, and auth.audit_log_entries recorded a `login` at 19:57:16: the scanner, 26 s
      // later, with no password ever set. By the time he clicked, the token was spent and he
      // got "invalid or expired link". sydneytu@ufl.edu shows the same 26 s signature, so UF's
      // Microsoft 365 filter does it too - this is not one vendor's quirk.
      //
      // generateLink() mints the recovery token WITHOUT sending anything and returns its
      // hashed_token. We build an app URL from that and return it to the PI to pass on by
      // whatever channel they choose. The token is then redeemed only by the
      // verifyOtp({ token_hash, type: 'recovery' }) call in src/pages/ResetPasswordVerify.tsx,
      // which no scanner runs because fetching a URL does not execute the page's JavaScript.
      //
      // The `#` must NOT be percent-encoded: the app uses HashRouter and this has to arrive as
      // a fragment.
      //
      // WARNING: generateLink() and resetPasswordForEmail() each mint a recovery token, and the
      // later call invalidates the earlier one. Do not reintroduce a resetPasswordForEmail call
      // alongside this, or whichever link the PI sends will already be dead on arrival.
      const resendKey = Deno.env.get('RESEND_API_KEY')
      let setPasswordUrl_: string | undefined
      let linkError: string | undefined
      let emailSent = false

      const { data: linkData, error: genError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      })
      if (genError) {
        console.error('Set-password link generation failed:', genError.message)
        linkError = genError.message
      } else if (linkData?.properties?.hashed_token) {
        setPasswordUrl_ = setPasswordUrl(linkData.properties.hashed_token)
        // Mail it from the lab's own domain via Resend. If that fails the PI still has the link
        // and the password in the response, so account creation is never blocked by mail.
        if (resendKey) {
          const sendError = await sendRecoveryEmail(resendKey, email, setPasswordUrl_)
          if (sendError) console.error('Set-password email failed:', sendError)
          else emailSent = true
        } else {
          console.error('RESEND_API_KEY is not set; returning the link without mailing it.')
        }
      } else {
        linkError = 'Supabase returned no hashed_token'
      }

      console.log(
        'User created successfully:',
        newUser.user.id,
        emailSent ? '(emailed)' : setPasswordUrl_ ? '(link generated, not emailed)' : '(link failed)'
      )
      return new Response(
        JSON.stringify({
          success: true,
          user: newUser.user,
          setPasswordUrl: setPasswordUrl_,
          emailSent,
          linkError,
          // Always returned now, not only on failure. The link is the primary route, but a
          // recovery token expires (1 hour by default) while this password does not, so the
          // PI keeps a second way in without another round trip.
          password: generatedPassword,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'updateRole') {
      // Only a PI may hand out the PI role.
      if (role === 'pi' && !callerIsPi) {
        return new Response(
          JSON.stringify({ error: 'Only a PI can grant the PI role.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // One transactional call instead of DELETE-then-INSERT across two requests.
      // The old version could wipe a user's roles and leave them with none if the role
      // string was invalid, and only a PI can repair user_roles - so the account was
      // stuck. set_user_role validates via the app_role parameter type, is atomic, and
      // refuses to remove the last active PI.
      const { error: roleUpdateError } = await supabaseAdmin.rpc('set_user_role', {
        _target: userId,
        _role: role,
        _actor: authenticatedUserId,
      })

      if (roleUpdateError) {
        console.error('Role update error:', roleUpdateError)
        return new Response(JSON.stringify({ error: roleUpdateError.message }), {
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

    if (action === 'resetPassword') {
      // Set a new password directly and hand it back to the caller.
      //
      // Exists because email delivery is the single point of failure in the self-service
      // reset flow: when the mail provider is down, misconfigured, or unpaid, a locked-out
      // student has no route back in at all. This gives the PI an offline path that depends
      // on nothing external. PI only - a manager can change roles but must not be able to
      // take over an account by setting its password and reading it back.
      if (!callerIsPi) {
        return new Response(
          JSON.stringify({ error: "Only a PI can reset another user's password." }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'No user specified.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const newPassword = crypto.randomUUID()

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (pwError) {
        console.error('Password reset error:', pwError)
        return new Response(JSON.stringify({ error: pwError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Log that it happened, but never the password itself.
      await supabaseAdmin.from('activity_logs').insert({
        user_id: authenticatedUserId,
        action_type: 'update',
        entity_type: 'user',
        entity_id: userId,
        entity_name: email || 'User',
        metadata: { action: 'reset_password' }
      })

      console.log('Password reset for user:', userId)
      return new Response(JSON.stringify({ success: true, password: newPassword }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'reactivate') {
      const { error: reactivateError } = await supabaseAdmin.rpc('set_user_active', {
        _target: userId,
        _active: true,
        _actor: authenticatedUserId,
      })

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