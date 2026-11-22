(() => {
  const SUPABASE_URL = "https://wayglygbfunnqrcoymjz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wXT2-6wZam4CR0Kd9BuDyw_-RaCxKps";
  const BUCKET = "player-documents";
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const $ = (id) => document.getElementById(id);
  const authPanel = $("auth-panel");
  const profilePanel = $("profile-panel");
  const signupForm = $("signup-form");
  const loginForm = $("login-form");
  const profileForm = $("profile-form");
  let currentUser = null;
  let currentProfile = null;

  $("year").textContent = new Date().getFullYear();

  function message(text, type = "success") {
    const el = $("message");
    el.textContent = text;
    el.className = "message show " + type;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function clearMessage() {
    $("message").className = "message";
    $("message").textContent = "";
  }
  function switchTab(tab) {
    clearMessage();
    const signup = tab === "signup";
    signupForm.classList.toggle("hidden", !signup);
    loginForm.classList.toggle("hidden", signup);
    $("show-signup").classList.toggle("active", signup);
    $("show-login").classList.toggle("active", !signup);
  }
  $("show-signup").addEventListener("click", () => switchTab("signup"));
  $("show-login").addEventListener("click", () => switchTab("login"));

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    if (!$("adult-confirm").checked) return message("You must confirm that you are 18 or older to register.", "error");
    const email = $("signup-email").value.trim();
    const password = $("signup-password").value;
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) return message(error.message, "error");
    if (data.session) {
      currentUser = data.user;
      await loadProfile();
      message("Your account has been created.", "success");
    } else {
      message("Account created. Please check your email and confirm your address before logging in.", "success");
      switchTab("login");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    const { data, error } = await db.auth.signInWithPassword({
      email: $("login-email").value.trim(),
      password: $("login-password").value
    });
    if (error) return message(error.message, "error");
    currentUser = data.user;
    await loadProfile();
    message("You are logged in.", "success");
  });

  $("reset-password").addEventListener("click", async () => {
    const email = $("login-email").value.trim();
    if (!email) return message("Enter your email address first, then select Forgot your password.", "error");
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) return message(error.message, "error");
    message("If the email is registered, a password-reset link will be sent. Check your inbox.", "success");
  });

  $("logout-button").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();
    if (error) return message(error.message, "error");
    currentUser = null;
    currentProfile = null;
    profilePanel.classList.add("hidden");
    authPanel.classList.remove("hidden");
    profileForm.reset();
    switchTab("login");
    message("You have logged out.", "success");
  });

  function showDashboard() {
    authPanel.classList.add("hidden");
    profilePanel.classList.remove("hidden");
  }
  function setValue(id, value) {
    $(id).value = value ?? "";
  }
  function fillProfile(p) {
    const fields = ["full_name","date_of_birth","nationality","country","city","primary_position","secondary_position","dominant_foot","height_cm","club_or_academy","experience"];
    fields.forEach((field) => setValue(field, p[field]));
    $("player-id").textContent = p.registration_id || "Created when you save";
  }

  async function loadProfile() {
    if (!currentUser) return;
    showDashboard();
    const { data, error } = await db.from("player_profiles").select("*").eq("user_id", currentUser.id).maybeSingle();
    if (error) {
      message("You are signed in, but your profile could not be loaded: " + error.message, "error");
      return;
    }
    currentProfile = data;
    if (data) fillProfile(data);
    else {
      $("player-id").textContent = "Created when you save";
      message("Welcome. Please complete your player profile.", "success");
    }
  }

  async function uploadFile(inputId, kind, maxBytes, allowedType) {
    const file = $(inputId).files[0];
    if (!file) return null;
    if (file.size > maxBytes) throw new Error(kind + " file is larger than the 5 MB limit.");
    if (!allowedType.includes(file.type)) throw new Error("Please choose an accepted file format for " + kind + ".");
    const extension = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = currentUser.id + "/" + kind + "-" + Date.now() + "." + extension;
    const { error } = await db.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return path;
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    if (!currentUser) return message("Please log in again.", "error");
    const dob = $("date_of_birth").value;
    if (!dob) return message("Please enter your date of birth.", "error");
    const birthDate = new Date(dob + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) return message("This initial registration portal is currently for players aged 18 and over.", "error");

    const button = profileForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      const photoPath = await uploadFile("profile-photo", "profile-photo", 5 * 1024 * 1024, ["image/jpeg","image/png","image/webp"]);
      const cvPath = await uploadFile("football-cv", "football-cv", 5 * 1024 * 1024, ["application/pdf"]);
      const profile = {
        user_id: currentUser.id,
        registration_id: currentProfile?.registration_id || ("RWM-" + crypto.randomUUID().slice(0, 8).toUpperCase()),
        full_name: $("full_name").value.trim(),
        date_of_birth: dob,
        nationality: $("nationality").value.trim(),
        country: $("country").value.trim(),
        city: $("city").value.trim() || null,
        primary_position: $("primary_position").value,
        secondary_position: $("secondary_position").value || null,
        dominant_foot: $("dominant_foot").value || null,
        height_cm: $("height_cm").value ? Number($("height_cm").value) : null,
        club_or_academy: $("club_or_academy").value.trim() || null,
        experience: $("experience").value.trim() || null,
        profile_photo_path: photoPath || currentProfile?.profile_photo_path || null,
        football_cv_path: cvPath || currentProfile?.football_cv_path || null,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await db.from("player_profiles").upsert(profile, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      currentProfile = data;
      fillProfile(data);
      $("file-status").textContent = "Profile saved. Your uploaded files are stored in your private player folder.";
      message("Your player profile has been saved successfully.", "success");
    } catch (error) {
      message("We could not save your profile: " + (error.message || "Please try again."), "error");
    } finally {
      button.disabled = false;
      button.textContent = "Save my profile";
    }
  });

  db.auth.getSession().then(({ data }) => {
    if (data.session) {
      currentUser = data.session.user;
      loadProfile();
    }
  });
  db.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentUser = session.user;
      loadProfile();
    }
  });
})();