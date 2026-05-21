// Supabase configuration and global variables
const SUPABASE_URL = 'https://lavhhlenhvziuwhgbcjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmhobGVuaHZ6aXV3aGdiY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTI0MzgsImV4cCI6MjA5MTIyODQzOH0._id3VTQwA_voRcNoA3qBIiCmsGpQB1pyymKn_Uiz3QU';


let currentUser = null;
let userProfile = null;
let allMembers = [];
let allEvents = [];
let allResources = [];
let allProjects = [];
let allAnnouncements = [];
let allBlogs = [];
let currentResourceFilter = 'all';
let currentBlogFilter = 'all';
let currentDateFilter = null;
let isDarkMode = true;

function initSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase CDN not loaded');
            return false;
        }
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase client created");
        return true;
    } catch (e) {
        console.error('Supabase init error:', e);
        return false;
    }
}

// Immediately initialise Supabase
(() => {
    if (!initSupabase()) {
        console.error('Supabase failed to initialise');
    }
})();