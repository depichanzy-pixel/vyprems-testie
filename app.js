(() => {
  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  const $ = (id) => document.getElementById(id);
  const modal = $("owner-modal");
  let supabase = null, currentUser = null, items = [];
  const toast = (message) => { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); };
  $("year").textContent = new Date().getFullYear();
  $("open-owner").addEventListener("click", () => {
    modal.classList.remove("hidden");
    if (!configured) $("login-message").textContent = "Konfigurasi Supabase belum diisi. Ikuti README_SETUP.md.";
  });
  document.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",()=>modal.classList.add("hidden")));
  $("lightbox-close").addEventListener("click",()=>$("lightbox").classList.add("hidden"));
  $("lightbox").addEventListener("click",e=>{if(e.target.id==="lightbox") $("lightbox").classList.add("hidden")});
  if (configured && window.supabase) {
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    supabase.auth.getSession().then(({data})=>{ if(data.session){currentUser=data.session.user; showDashboard();} });
    supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null; if(currentUser) showDashboard(); else showLogin();});
    loadTestimonials();
  }
  function showLogin(){ $("login-view").classList.remove("hidden"); $("dashboard-view").classList.add("hidden"); }
  function showDashboard(){ $("login-view").classList.add("hidden"); $("dashboard-view").classList.remove("hidden"); renderManage(); }
  async function loadTestimonials(){
    if(!supabase) return;
    const {data,error}=await supabase.from("testimonials").select("*").order("created_at",{ascending:false});
    if(error){console.error(error);return;}
    items=data||[]; renderGallery(); renderManage(); populateCategories();
  }
  function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function renderGallery(){
    const query=$("search").value.toLowerCase(), category=$("category-filter").value;
    const filtered=items.filter(x=>(!category||x.category===category)&&(`${x.title} ${x.category} ${x.description||""}`).toLowerCase().includes(query));
    $("total-count").textContent=items.length;
    $("gallery").innerHTML=filtered.length?filtered.map(x=>`<article class="testimonial-card">
      <img class="testimonial-image" src="${escapeHtml(x.image_url)}" alt="${escapeHtml(x.title)}" data-image="${escapeHtml(x.image_url)}" data-caption="${escapeHtml(x.title)}">
      <div class="testimonial-info"><div class="testimonial-meta"><h3>${escapeHtml(x.title)}</h3><span class="category-tag">${escapeHtml(x.category)}</span></div>
      ${x.description?`<p>${escapeHtml(x.description)}</p>`:""}</div></article>`).join(""):`<div class="empty-state"><span>✦</span><h3>${query||category?"Tidak ditemukan":"Belum ada testimoni"}</h3><p>Coba kata kunci atau kategori lain.</p></div>`;
    document.querySelectorAll(".testimonial-image").forEach(img=>img.addEventListener("click",()=>{ $("lightbox-image").src=img.dataset.image;$("lightbox-caption").textContent=img.dataset.caption;$("lightbox").classList.remove("hidden"); }));
  }
  function populateCategories(){
    const select=$("category-filter"),old=select.value,cats=[...new Set(items.map(x=>x.category).filter(Boolean))].sort();
    select.innerHTML='<option value="">Semua kategori</option>'+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    select.value=cats.includes(old)?old:"";
  }
  function renderManage(){
    if(!currentUser)return;
    $("manage-count").textContent=`${items.length} item`;
    $("manage-list").innerHTML=items.length?items.map(x=>`<div class="manage-item"><img src="${escapeHtml(x.image_url)}" alt=""><div><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.category)}</small></div><button class="delete-btn" data-delete="${escapeHtml(x.id)}">Hapus</button></div>`).join(""):'<p class="muted">Belum ada data.</p>';
    document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteItem(btn.dataset.delete)));
  }
  $("search").addEventListener("input",renderGallery); $("category-filter").addEventListener("change",renderGallery);
  $("login-form").addEventListener("submit",async e=>{
    e.preventDefault(); if(!supabase)return;
    $("login-message").textContent="Memeriksa akun...";
    const {error}=await supabase.auth.signInWithPassword({email:$("owner-email").value,password:$("owner-password").value});
    $("login-message").textContent=error?error.message:"Login berhasil.";
  });
  $("logout").addEventListener("click",async()=>{await supabase.auth.signOut();currentUser=null;showLogin();});
  $("upload-form").addEventListener("submit",async e=>{
    e.preventDefault(); if(!supabase||!currentUser)return;
    const file=$("image-file").files[0],msg=$("upload-message");
    if(!file)return;
    if(file.size>8*1024*1024){msg.textContent="Ukuran file maksimal 8 MB.";return;}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){msg.textContent="Format harus JPG, PNG, atau WEBP.";return;}
    msg.textContent="Mengunggah...";
    const ext=file.name.split(".").pop().toLowerCase(),path=`${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const upload=await supabase.storage.from("testimoni").upload(path,file,{contentType:file.type,upsert:false});
    if(upload.error){msg.textContent=upload.error.message;return;}
    const {data:publicData}=supabase.storage.from("testimoni").getPublicUrl(path);
    const {error}=await supabase.from("testimonials").insert({title:$("title").value.trim(),category:$("category").value.trim(),description:$("description").value.trim(),image_url:publicData.publicUrl,storage_path:path,created_by:currentUser.id});
    if(error){await supabase.storage.from("testimoni").remove([path]);msg.textContent=error.message;return;}
    e.target.reset();msg.textContent="";await loadTestimonials();toast("Testimoni berhasil diunggah.");
  });
  async function deleteItem(id){
    if(!confirm("Hapus testimoni ini?"))return;
    const item=items.find(x=>String(x.id)===String(id));if(!item)return;
    const {error}=await supabase.from("testimonials").delete().eq("id",id);
    if(error){toast(error.message);return;}
    if(item.storage_path) await supabase.storage.from("testimoni").remove([item.storage_path]);
    await loadTestimonials();toast("Testimoni dihapus.");
  }

  // Export a portable JSON backup containing metadata and image bytes.
  $("backup-export").addEventListener("click", async () => {
    if(!supabase || !currentUser) return;
    const btn=$("backup-export"); btn.disabled=true; btn.textContent="Menyiapkan...";
    try{
      const payload=[];
      for(const item of items){
        const response=await fetch(item.image_url);
        if(!response.ok) throw new Error("Gagal mengambil gambar: "+item.title);
        const blob=await response.blob();
        const dataUrl=await new Promise((resolve,reject)=>{
          const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(blob);
        });
        payload.push({title:item.title,category:item.category,description:item.description||"",image:dataUrl,fileName:(item.storage_path||"image.jpg").split("/").pop()});
      }
      const backup={format:"devitads-testimoni-backup",version:1,createdAt:new Date().toISOString(),items:payload};
      const blob=new Blob([JSON.stringify(backup)],{type:"application/json"});
      const url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download=`devitads-testimoni-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
      toast("Backup berhasil dibuat.");
    }catch(err){toast("Backup gagal: "+err.message);}
    finally{btn.disabled=false;btn.textContent="↓ Backup data";}
  });
  $("backup-import").addEventListener("change", async (e) => {
    const file=e.target.files[0]; if(!file||!supabase||!currentUser)return;
    if(!confirm("Restore akan menambahkan semua item dari file backup. Lanjutkan?")){e.target.value="";return;}
    try{
      const backup=JSON.parse(await file.text());
      if(backup.format!=="devitads-testimoni-backup"||!Array.isArray(backup.items)) throw new Error("Format backup tidak valid.");
      for(let i=0;i<backup.items.length;i++){
        const item=backup.items[i];
        if(!item.image||!item.title||!item.category) continue;
        const parts=item.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if(!parts) continue;
        const bytes=Uint8Array.from(atob(parts[2]),c=>c.charCodeAt(0));
        const blob=new Blob([bytes],{type:parts[1]});
        const ext=parts[1].split("/")[1].replace("jpeg","jpg");
        const path=`restore-${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const uploaded=await supabase.storage.from("testimoni").upload(path,blob,{contentType:parts[1],upsert:false});
        if(uploaded.error) throw uploaded.error;
        const {data:pub}=supabase.storage.from("testimoni").getPublicUrl(path);
        const {error}=await supabase.from("testimonials").insert({title:item.title,category:item.category,description:item.description||"",image_url:pub.publicUrl,storage_path:path,created_by:currentUser.id});
        if(error){await supabase.storage.from("testimoni").remove([path]);throw error;}
      }
      await loadTestimonials();toast("Restore backup selesai.");
    }catch(err){toast("Restore gagal: "+err.message);}
    finally{e.target.value="";}
  });

})();