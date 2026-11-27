(() => {
  "use strict";
  const SUPABASE_URL = "https://wayglygbfunnqrcoymjz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wXT2-6wZam4CR0Kd9BuDyw_-RaCxKps";
  const CLOUDINARY_SIGNER = SUPABASE_URL + "/functions/v1/cloudinary-signature";
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
  const MAX_VIDEOS = 3;
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = (id) => document.getElementById(id);
  const authPanel=$("auth-panel"), profilePanel=$("profile-panel"), adminPanel=$("admin-panel");
  const signupForm=$("signup-form"), loginForm=$("login-form"), profileForm=$("profile-form");
  let currentUser=null, currentProfile=null, playerMedia=[], selectedAdminPlayerId=null;
  $("year").textContent=new Date().getFullYear();

  function message(text,type="success"){
    const el=$("message"); el.textContent=text; el.className="message show "+type;
    el.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function clearMessage(){ $("message").className="message"; $("message").textContent=""; }
  function switchTab(tab){
    clearMessage(); const signup=tab==="signup";
    signupForm.classList.toggle("hidden",!signup); loginForm.classList.toggle("hidden",signup);
    $("show-signup").classList.toggle("active",signup); $("show-login").classList.toggle("active",!signup);
  }
  $("show-signup").addEventListener("click",()=>switchTab("signup"));
  $("show-login").addEventListener("click",()=>switchTab("login"));

  function updateGuardianFields(){
    const dob=$("signup-dob").value, age=ageFromDOB(dob), underage=age!==null&&age<18;
    $("guardian-fields").classList.toggle("hidden",!underage);
    ["guardian-name","guardian-relationship","guardian-email","guardian-phone","guardian-consent"].forEach(id=>$(id).required=underage);
    $("age-guidance").textContent=underage
      ? "This player is under 18. A parent or legal guardian must provide their details and consent. The account will be flagged for guardian review."
      : "Players aged 18 or over can register independently.";
  }
  $("signup-dob").addEventListener("change",updateGuardianFields);

  signupForm.addEventListener("submit",async e=>{
    e.preventDefault(); clearMessage();
    const btn=signupForm.querySelector('button[type="submit"]');
    const email=$("signup-email").value.trim();
    const password=$("signup-password").value;
    const dob=$("signup-dob").value, age=ageFromDOB(dob);
    if(!email||!password||!dob)return message("Enter your email address, date of birth and password to continue.","error");
    if(age===null||age<0)return message("Please enter a valid date of birth.","error");
    const underage=age<18;
    const guardian={
      full_name:$("guardian-name").value.trim(),
      relationship:$("guardian-relationship").value,
      email:$("guardian-email").value.trim(),
      phone:$("guardian-phone").value.trim(),
      consent: $("guardian-consent").checked
    };
    if(underage){
      if(!guardian.full_name||!guardian.relationship||!guardian.email||!guardian.phone||!guardian.consent)
        return message("For a player under 18, complete all parent/guardian details and confirm their consent before continuing.","error");
      if(guardian.email.toLowerCase()===email.toLowerCase())
        return message("Please provide a parent or guardian email address, not the player's email address.","error");
    }
    if(password.length<8)return message("Your password must contain at least 8 characters.","error");
    btn.disabled=true;btn.textContent="Creating account…";
    try{
      const {data,error}=await db.auth.signUp({email,password,options:{
        emailRedirectTo:location.origin+location.pathname,
        data:{
          date_of_birth:dob,
          age_group:underage?"under_18":"adult",
          guardian_review_status:underage?"pending":"not_required",
          guardian_full_name:underage?guardian.full_name:null,
          guardian_relationship:underage?guardian.relationship:null,
          guardian_email:underage?guardian.email:null,
          guardian_phone:underage?guardian.phone:null,
          guardian_consent_declared:underage?true:false,
          guardian_consent_recorded_at:underage?new Date().toISOString():null
        }
      }});
      if(error)throw error;
      if(data.session&&data.user){
        currentUser=data.user;await loadProfile();
        message(underage?"Your account has been created. It is marked as awaiting guardian review. Please complete the player profile; no trial, selection or placement is guaranteed.":"Your account has been created. Please complete your player profile.");
      }else{
        switchTab("login");
        message("Your registration request was received. Check your inbox (and spam folder) for the confirmation email. You must confirm your email before logging in."+(underage?" Your account is also marked as awaiting guardian review.":""));
      }
    }catch(err){
      const detail=err?.message||"The registration service could not be reached.";
      message("Registration was not completed: "+detail+" If the problem continues, contact support@radiantwavesmedia.com.","error");
    }finally{btn.disabled=false;btn.textContent="Create account";}
  });
  loginForm.addEventListener("submit",async e=>{
    e.preventDefault();clearMessage();
    const btn=loginForm.querySelector('button[type="submit"]');
    btn.disabled=true;btn.textContent="Logging in…";
    try{
      const {data,error}=await db.auth.signInWithPassword({email:$("login-email").value.trim(),password:$("login-password").value});
      if(error)throw error;
      currentUser=data.user;await loadProfile();message("You are logged in.");
    }catch(err){message("Login failed: "+(err?.message||"Please check your details and try again."),"error");}
    finally{btn.disabled=false;btn.textContent="Log in";}
  });
  $("reset-password").addEventListener("click",async()=>{
    const email=$("login-email").value.trim();
    if(!email)return message("Enter your email address first.","error");
    const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
    if(error)return message(error.message,"error");
    message("If the email is registered, a password-reset link will be sent.");
  });
  $("logout-button").addEventListener("click",async()=>{
    const {error}=await db.auth.signOut();if(error)return message(error.message,"error");
    currentUser=null;currentProfile=null;playerMedia=[];profilePanel.classList.add("hidden");
    adminPanel.classList.add("hidden");authPanel.classList.remove("hidden");profileForm.reset();
    switchTab("login");message("You have logged out.");
  });
  function setValue(id,v){$(id).value=v??"";}
  function fillProfile(p){
    ["full_name","date_of_birth","nationality","country","city","primary_position","secondary_position","dominant_foot","height_cm","club_or_academy","experience"].forEach(k=>setValue(k,p[k]));
    $("player-id").textContent=p.registration_id||"Created when you save";
  }
  function ageFromDOB(dob){
    if(!dob)return null;const d=new Date(dob+"T00:00:00"),n=new Date();
    let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a;
  }
  async function loadProfile(){
    if(!currentUser)return;
    authPanel.classList.add("hidden");profilePanel.classList.remove("hidden");
    const {data,error}=await db.from("player_profiles").select("*").eq("user_id",currentUser.id).maybeSingle();
    if(error){message("Signed in, but the profile could not be loaded: "+error.message,"error");return;}
    currentProfile=data;if(data)fillProfile(data);else message("Welcome. Please complete your player profile.");
    const isAdmin=currentUser.app_metadata?.role==="admin";
    adminPanel.classList.toggle("hidden",!isAdmin);
    if(isAdmin){await loadAdminPlayers();await loadAdminMedia();await loadAdminMessages();}
    await loadPlayerMedia();
    await loadPlayerMessages();
  }
  async function uploadFile(inputId,kind,maxBytes,allowed){
    const f=$(inputId).files[0];if(!f)return null;
    if(f.size>maxBytes)throw new Error(kind+" exceeds the 5 MB limit.");
    if(!allowed.includes(f.type))throw new Error("Unsupported file format for "+kind+".");
    const ext=f.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=currentUser.id+"/"+kind+"-"+Date.now()+"."+ext;
    const {error}=await db.storage.from("player-documents").upload(path,f,{upsert:true,contentType:f.type});
    if(error)throw error;return path;
  }
  profileForm.addEventListener("submit",async e=>{
    e.preventDefault();clearMessage();if(!currentUser)return message("Please log in again.","error");
    const dob=$("date_of_birth").value;if(!dob)return message("Please enter your date of birth.","error");
    const playerAge=ageFromDOB(dob);
    const underage=playerAge!==null&&playerAge<18;
    const guardian=currentUser.user_metadata||{};
    if(playerAge===null||playerAge<0)return message("Please enter a valid date of birth.","error");
    if(underage&&!(guardian.age_group==="under_18"&&guardian.guardian_consent_declared===true&&guardian.guardian_full_name&&guardian.guardian_email&&guardian.guardian_phone&&guardian.guardian_relationship))
      return message("A parent or legal guardian's details and consent are required before saving a profile for a player under 18. Please contact support if you need to correct your registration details.","error");
    const btn=profileForm.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Saving…";
    try{
      const photo=await uploadFile("profile-photo","profile-photo",5*1024*1024,["image/jpeg","image/png","image/webp"]);
      const cv=await uploadFile("football-cv","football-cv",5*1024*1024,["application/pdf"]);
      const p={user_id:currentUser.id,registration_id:currentProfile?.registration_id||("RWM-"+crypto.randomUUID().slice(0,8).toUpperCase()),
        full_name:$("full_name").value.trim(),date_of_birth:dob,nationality:$("nationality").value.trim(),country:$("country").value.trim(),
        city:$("city").value.trim()||null,primary_position:$("primary_position").value,secondary_position:$("secondary_position").value||null,
        dominant_foot:$("dominant_foot").value||null,height_cm:$("height_cm").value?Number($("height_cm").value):null,
        club_or_academy:$("club_or_academy").value.trim()||null,experience:$("experience").value.trim()||null,
        profile_photo_path:photo||currentProfile?.profile_photo_path||null,football_cv_path:cv||currentProfile?.football_cv_path||null,updated_at:new Date().toISOString()};
      let saved;
      if(currentProfile){
        const {data,error}=await db.from("player_profiles").update(p).eq("user_id",currentUser.id).select().single();
        if(error)throw error;saved=data;
      }else{
        const {data,error}=await db.from("player_profiles").insert(p).select().single();
        if(error)throw error;saved=data;
      }
      currentProfile=saved;fillProfile(saved);$("file-status").textContent="Profile saved. Your documents remain in your private player folder.";
      message("Your player profile has been saved.");
    }catch(err){message("We could not save your profile: "+(err.message||"Please try again."),"error");}
    finally{btn.disabled=false;btn.textContent="Save my profile";}
  });

  async function getVideoDuration(file){
    return new Promise((resolve,reject)=>{
      const video=document.createElement("video"),url=URL.createObjectURL(file);
      video.preload="metadata";video.onloadedmetadata=()=>{const d=video.duration;URL.revokeObjectURL(url);resolve(d);};
      video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("The video could not be read."));};video.src=url;
    });
  }
  async function uploadHighlight(){
    const file=$("highlight-video").files[0];if(!file)return message("Choose a video first.","error");
    if(!["video/mp4","video/quicktime","video/webm"].includes(file.type))return message("Choose an MP4, MOV or WEBM video.","error");
    if(file.size>MAX_VIDEO_BYTES)return message("Each highlight must be 50 MB or smaller.","error");
    const duration=await getVideoDuration(file);if(!Number.isFinite(duration)||duration>60)return message("Each highlight must be 60 seconds or shorter.","error");
    $("upload-video").disabled=true;$("video-status").textContent="Preparing secure upload…";
    try{
      const {data:{session}}=await db.auth.getSession();if(!session)throw new Error("Your session has expired. Log in again.");
      const {data:rows,error:countError}=await db.from("player_media").select("id").eq("user_id",currentUser.id).eq("media_type","video");
      if(countError)throw countError;if((rows||[]).length>=MAX_VIDEOS)throw new Error("You have reached the limit of 3 highlight videos.");
      const signResponse=await fetch(CLOUDINARY_SIGNER,{method:"POST",headers:{Authorization:"Bearer "+session.access_token,apikey:SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({})});
      const signed=await signResponse.json();if(!signResponse.ok)throw new Error(signed.error||"Could not obtain a secure upload signature.");
      const form=new FormData();form.append("file",file);form.append("timestamp",String(signed.timestamp));form.append("folder",signed.folder);
      form.append("upload_preset",signed.upload_preset);form.append("api_key",signed.api_key);form.append("signature",signed.signature);
      const upload=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(signed.cloud_name)+"/video/upload",{method:"POST",body:form});
      const result=await upload.json();if(!upload.ok)throw new Error(result.error?.message||"Cloudinary upload failed.");
      const record={user_id:currentUser.id,media_type:"video",storage_path:result.public_id,external_url:result.secure_url};
      const {error:insertError}=await db.from("player_media").insert(record);if(insertError)throw insertError;
      $("highlight-video").value="";$("video-status").textContent="Video uploaded successfully.";await loadPlayerMedia();
    }catch(err){$("video-status").textContent="";message("Video upload failed: "+(err.message||"Please try again."),"error");}
    finally{$("upload-video").disabled=false;}
  }
  $("upload-video").addEventListener("click",uploadHighlight);
  async function loadPlayerMedia(){
    if(!currentUser)return;
    const {data,error}=await db.from("player_media").select("id,media_type,storage_path,external_url").eq("user_id",currentUser.id).order("id",{ascending:false});
    if(error){$("player-media-list").textContent="Your video list could not be loaded: "+error.message;return;}
    playerMedia=data||[];$("player-media-list").replaceChildren();
    playerMedia.filter(m=>m.media_type==="video"&&m.external_url).forEach(m=>{
      const card=document.createElement("div");card.className="video-card";
      const v=document.createElement("video");v.src=m.external_url;v.controls=true;v.preload="metadata";v.playsInline=true;
      const label=document.createElement("p");label.textContent="Your highlight video";
      card.append(v,label);$("player-media-list").append(card);
    });
    if(!playerMedia.length)$("player-media-list").textContent="No highlight videos uploaded yet.";
  }
  async function loadPlayerMessages(){
    if(!currentUser)return;
    const root=$("player-messages"),status=$("player-message-status");
    const {data,error}=await db.from("player_messages").select("id,sender_role,subject,body,created_at,read_at").eq("player_user_id",currentUser.id).order("created_at",{ascending:true}).limit(200);
    if(error){status.textContent="Messages could not be loaded: "+error.message;return;}
    root.replaceChildren();
    if(!(data||[]).length){root.textContent="You have no messages yet.";status.textContent="";return;}
    (data||[]).forEach(m=>{
      const card=document.createElement("article");card.className="message-item";
      const head=document.createElement("div");head.className="message-item-head";
      const sender=document.createElement("strong");sender.textContent=m.sender_role==="admin"?"RadiantWaves Talent Administration":"Your reply";
      const date=document.createElement("time");date.textContent=new Date(m.created_at).toLocaleString();
      const subject=document.createElement("h4");subject.textContent=m.subject;
      const body=document.createElement("p");body.textContent=m.body;
      head.append(sender,date);card.append(head,subject,body);root.append(card);
    });
    const unread=(data||[]).filter(m=>m.sender_role==="admin"&&!m.read_at).map(m=>m.id);
    if(unread.length){
      await db.from("player_messages").update({read_at:new Date().toISOString()}).in("id",unread);
    }
    status.textContent=data.length+" message(s) in your conversation.";
  }

  async function loadAdminMessages(){
    const root=$("admin-message-results"),status=$("admin-message-status");
    const {data,error}=await db.from("player_messages").select("id,player_user_id,sender_role,subject,body,created_at,read_at").order("created_at",{ascending:false}).limit(300);
    if(error){status.textContent="Messages could not be loaded: "+error.message;return;}
    root.replaceChildren();
    if(!(data||[]).length){root.textContent="No player messages yet.";status.textContent="";return;}
    const names=new Map((window.__rwAdminPlayers||[]).map(p=>[p.user_id,p.full_name||"Player"]));
    (data||[]).forEach(m=>{
      const card=document.createElement("article");card.className="message-item";
      const head=document.createElement("div");head.className="message-item-head";
      const sender=document.createElement("strong");sender.textContent=(names.get(m.player_user_id)||"Player")+" · "+(m.sender_role==="player"?"Player reply":"Administration");
      const date=document.createElement("time");date.textContent=new Date(m.created_at).toLocaleString();
      const subject=document.createElement("h4");subject.textContent=m.subject;
      const body=document.createElement("p");body.textContent=m.body;
      const reply=document.createElement("button");reply.type="button";reply.className="outline-button";reply.textContent="Reply to player";
      reply.addEventListener("click",()=>openAdminMessage(m.player_user_id,names.get(m.player_user_id)||"Player","Re: "+m.subject));
      head.append(sender,date);card.append(head,subject,body,reply);root.append(card);
      if(m.sender_role==="player"&&!m.read_at){
        db.from("player_messages").update({read_at:new Date().toISOString()}).eq("id",m.id);
      }
    });
    status.textContent=data.length+" message(s) retrieved.";
  }

  function openAdminMessage(playerId,playerName,subject){
    selectedAdminPlayerId=playerId;
    $("admin-message-recipient").textContent="Message to "+playerName;
    $("admin-message-subject").value=subject||"RadiantWaves Football Talent – Registration Update";
    $("admin-message-compose").classList.remove("hidden");
    $("admin-message-compose").scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  $("admin-message-form").addEventListener("submit",async e=>{
    e.preventDefault();
    if(!selectedAdminPlayerId)return;
    const btn=$("admin-message-form").querySelector('button[type="submit"]');
    btn.disabled=true;
    try{
      const {error}=await db.from("player_messages").insert({
        player_user_id:selectedAdminPlayerId,sender_user_id:currentUser.id,sender_role:"admin",
        subject:$("admin-message-subject").value.trim(),body:$("admin-message-body").value.trim()
      });
      if(error)throw error;
      $("admin-message-body").value="";
      $("admin-message-compose").classList.add("hidden");
      $("admin-message-status").textContent="Message saved and delivered to the player's in-app inbox.";
      selectedAdminPlayerId=null;
      await loadAdminMessages();
    }catch(err){$("admin-message-status").textContent="Message could not be sent: "+(err.message||"Please try again.");}
    finally{btn.disabled=false;}
  });
  $("admin-message-cancel").addEventListener("click",()=>{
    selectedAdminPlayerId=null;$("admin-message-compose").classList.add("hidden");
  });
  $("player-reply-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const body=$("player-reply-body").value.trim();if(!body)return;
    const btn=$("player-reply-form").querySelector('button[type="submit"]');btn.disabled=true;
    try{
      const {error}=await db.from("player_messages").insert({
        player_user_id:currentUser.id,sender_user_id:currentUser.id,sender_role:"player",
        subject:"Reply from player"
        ,body
      });
      if(error)throw error;
      $("player-reply-body").value="";
      $("player-message-status").textContent="Your reply has been sent to Talent Administration.";
      await loadPlayerMessages();
    }catch(err){$("player-message-status").textContent="Your reply could not be sent: "+(err.message||"Please try again.");}
    finally{btn.disabled=false;}
  });

  async function loadAdminPlayers(){
    $("admin-status").textContent="Loading player records…";
    const {data,error}=await db.from("player_profiles").select("*").limit(500);
    if(error){$("admin-status").textContent="Admin access is not enabled by database policy: "+error.message;return;}
    window.__rwAdminPlayers=data||[];$("admin-status").textContent=(data||[]).length+" player profile(s) retrieved.";
    renderAdminPlayers();
  }
  async function loadAdminMedia(){
    const status=$("admin-media-status"),root=$("admin-media-results");
    status.textContent="Loading player media…";root.replaceChildren();
    const {data,error}=await db.from("player_media").select("id,user_id,media_type,storage_path,external_url").limit(1000);
    if(error){status.textContent="Could not load player media: "+error.message;return;}
    status.textContent=(data||[]).length+" media record(s) retrieved.";
    if(!(data||[]).length){root.textContent="No player media has been uploaded yet.";return;}
    (data||[]).forEach(m=>{
      const card=document.createElement("article");card.className="player-result";
      const title=document.createElement("h4");title.textContent=(m.media_type||"Media")+" · Player "+(m.user_id||"unknown");
      const details=document.createElement("p");details.textContent="Media record: "+m.id;
      card.append(title,details);
      if(m.external_url){
        const link=document.createElement("a");link.href=m.external_url;link.target="_blank";link.rel="noopener noreferrer";
        link.textContent="Open uploaded media";link.style.color="var(--gold)";card.append(link);
      }else if(m.storage_path){
        const path=document.createElement("p");path.textContent="Storage path: "+m.storage_path;card.append(path);
      }
      root.append(card);
    });
  }
  function renderAdminPlayers(){
    const list=window.__rwAdminPlayers||[],name=$("admin-search").value.trim().toLowerCase(),country=$("admin-country").value.trim().toLowerCase();
    const pos=$("admin-position").value,min=Number($("admin-min-age").value)||18,max=Number($("admin-max-age").value)||99;
    const matches=list.filter(p=>{
      const age=ageFromDOB(p.date_of_birth);
      return (!name||(p.full_name||"").toLowerCase().includes(name))&&(!country||(p.country||"").toLowerCase().includes(country))&&
        (!pos||p.primary_position===pos)&&(age===null||(age>=min&&age<=max));
    });
    const root=$("admin-results");root.replaceChildren();
    if(!matches.length){root.textContent="No players match these filters.";return;}
    matches.forEach(p=>{
      const card=document.createElement("article");card.className="player-result";
      const title=document.createElement("h4");title.textContent=p.full_name||"Unnamed player";
      const details=document.createElement("p");details.textContent=[p.registration_id,p.country,ageFromDOB(p.date_of_birth)+" years",p.primary_position,p.club_or_academy].filter(Boolean).join(" · ");
      const exp=document.createElement("p");exp.textContent=p.experience||"No experience summary provided.";
      const contact=document.createElement("button");contact.type="button";contact.className="outline-button";contact.textContent="Message player";
      contact.addEventListener("click",()=>openAdminMessage(p.user_id,p.full_name||"Player"));
      card.append(title,details,exp,contact);root.append(card);
    });
  }
  ["admin-search","admin-country","admin-position","admin-min-age","admin-max-age"].forEach(id=>$(id).addEventListener("input",renderAdminPlayers));
  $("admin-refresh").addEventListener("click",async()=>{await loadAdminPlayers();await loadAdminMedia();});

  db.auth.getSession().then(({data})=>{if(data.session){currentUser=data.session.user;loadProfile();}});
  db.auth.onAuthStateChange((_event,session)=>{if(session?.user){currentUser=session.user;loadProfile();}});
})();