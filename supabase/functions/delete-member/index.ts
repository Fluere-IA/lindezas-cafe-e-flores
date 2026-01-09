import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteMemberRequest {
  memberId: string;
  userId: string;
  organizationId: string;
  deleteFromDatabase: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requester is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { memberId, userId, organizationId, deleteFromDatabase }: DeleteMemberRequest = await req.json();

    if (!memberId || !userId || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requester is an owner or admin of the organization
    const { data: requesterMembership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id)
      .single();

    if (membershipError || !requesterMembership) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["owner", "admin"].includes(requesterMembership.role)) {
      return new Response(
        JSON.stringify({ error: "Only owners and admins can delete members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target is an owner (cannot delete owners)
    const { data: targetMembership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("id", memberId)
      .single();

    if (targetMembership?.role === "owner") {
      return new Response(
        JSON.stringify({ error: "Cannot delete organization owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email to delete related invites
    const { data: targetUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = targetUserData?.user?.email;

    // Delete from organization_members
    const { error: deleteMemberError } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (deleteMemberError) {
      console.error("Error deleting member:", deleteMemberError);
      return new Response(
        JSON.stringify({ error: "Failed to remove member from organization" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete related invites for this email in this organization
    if (userEmail) {
      const { error: deleteInvitesError } = await supabaseAdmin
        .from("organization_invites")
        .delete()
        .eq("organization_id", organizationId)
        .ilike("email", userEmail);

      if (deleteInvitesError) {
        console.error("Error deleting invites:", deleteInvitesError);
        // Don't fail the request, just log
      } else {
        console.log(`Deleted invites for ${userEmail} in org ${organizationId}`);
      }
    }

    // If requested, also delete the user from the database
    if (deleteFromDatabase) {
      // First, check if user is member of any other organization
      const { data: otherMemberships, error: otherMembershipsError } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (otherMembershipsError) {
        console.error("Error checking other memberships:", otherMembershipsError);
      }

      // Only delete user if they have no other memberships
      if (!otherMemberships || otherMemberships.length === 0) {
        // Delete user_roles
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Delete profile
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", userId);

        // Delete from auth.users
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteUserError) {
          console.error("Error deleting user from auth:", deleteUserError);
          return new Response(
            JSON.stringify({ 
              success: true, 
              memberDeleted: true, 
              userDeleted: false,
              message: "Member removed but could not delete user account"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`User ${userId} completely deleted from database`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            memberDeleted: true, 
            userDeleted: true,
            message: "Member and user account deleted successfully"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: true, 
            memberDeleted: true, 
            userDeleted: false,
            message: "Member removed. User belongs to other organizations and was not deleted."
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        memberDeleted: true, 
        userDeleted: false,
        message: "Member removed successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in delete-member function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
