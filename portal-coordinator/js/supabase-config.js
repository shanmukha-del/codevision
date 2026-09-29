/**
 * CODEVISION 2026 — SUPABASE CONFIGURATION & CLIENT
 * Direct Cloud Backend with Realtime Sync and Team Profile Image Storage.
 */

(function() {
  const SUPABASE_URL = "https://ezlmspomkhbluxwxpdge.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bG1zcG9ta2hibHV4d3hwZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MzA3MTMsImV4cCI6MjEwNjIwNjcxM30.0QL0FlvewJj-mKoUQlhKdcVRxEVmr-Hyt4TIs4iXyTo";
  const STORAGE_BUCKET = "team-profiles";

  let supabaseClient = null;

  function initClient() {
    if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    }
    return supabaseClient;
  }

  // Attempt immediate initialization
  initClient();

  /**
   * Upload team profile image / coordinator avatar to Supabase Storage
   * @param {File} file - Browser File object from <input type="file">
   * @param {string} folder - 'coordinators', 'leaders', or 'teams'
   * @returns {Promise<{success: boolean, publicUrl?: string, error?: string}>}
   */
  async function uploadProfileImage(file, folder = 'team-profiles') {
    const client = initClient();
    if (!client) {
      return { success: false, error: "Supabase client not loaded. Ensure supabase-js script is included." };
    }

    try {
      if (!file) throw new Error("No file provided");
      
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

      const { data, error: uploadError } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = client.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return {
        success: true,
        path: data.path,
        publicUrl: urlData.publicUrl
      };
    } catch (e) {
      console.error("Profile image upload failed:", e);
      return {
        success: false,
        error: e.message || "Failed to upload image"
      };
    }
  }

  // Global interface
  window.CodevisionSupabase = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    bucket: STORAGE_BUCKET,
    getClient: initClient,
    uploadProfileImage: uploadProfileImage,
    isReady: () => Boolean(initClient())
  };
})();
