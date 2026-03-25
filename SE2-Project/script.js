/**
 * CYBERTITANS - OMNI-DATA LOADER (100% SQL SYNC)
 */

let isLoggedIn = false;
let currentPage = 'home';
let toastTimer;

document.addEventListener('DOMContentLoaded', includeHTML);

async function includeHTML() {
    const elements = document.querySelectorAll('[include-html]');
    for (let el of elements) {
        const file = el.getAttribute('include-html');
        try {
            const response = await fetch(file + '?v=' + new Date().getTime());
            if (response.ok) el.outerHTML = await response.text();
        } catch (err) {}
    }
    initializeApp();
}

// ── CÁC HÀM XỬ LÝ LOGIC ──────────────────
function initializeApp() {
    showPage('home');
    startCountdown();
    buildRanking();
    buildAdminTable();
    buildPermTable();
    buildFaq();
    
    // KHÔI PHỤC TRẠNG THÁI ĐĂNG NHẬP KHI TẢI LẠI TRANG
    checkLoginState();
}

function checkLoginState() {
    const savedUser = localStorage.getItem('cyber_user');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        applyLoginState(userData);
    }
}

function applyLoginState(userData) {
    isLoggedIn = true;
    document.getElementById('nav-guest').style.display = 'none';
    const navUser = document.getElementById('nav-user');
    navUser.style.display = 'flex';
    
    // Cập nhật tên và Avatar trên thanh điều hướng
    const nameSpan = navUser.querySelector('span.hidden');
    const avatarDiv = navUser.querySelector('.w-7.h-7');
    
    if (nameSpan) nameSpan.textContent = userData.name;
    if (avatarDiv) {
        // Lấy 2 chữ cái đầu của tên làm Avatar
        const initials = userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarDiv.innerHTML = `<span class="text-[#0d6100] font-bold text-xs font-mono">${initials}</span>`;
    }
}

/**
 * Hàm hiện thông báo có màu sắc
 * @param {string} msg - Nội dung thông báo
 * @param {string} type - 'success' hoặc 'error'
 */
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    if (!t || !text) return;

    // Xóa các class màu cũ
    t.classList.remove('success', 'error');
    // Thêm class màu mới
    t.classList.add(type);
    
    text.textContent = msg;
    t.classList.add('show');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

async function doLogin() {
    const userEl = document.getElementById('login-user');
    const passEl = document.getElementById('login-pass');
    
    const user = userEl.value;
    const pass = passEl.value;

    if (!user || !pass) {
        showToast('Yêu cầu định danh: Vui lòng nhập đầy đủ thông tin!', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Lưu session
            localStorage.setItem('cyber_user', JSON.stringify(userData));
            
            // Đóng modal và áp dụng giao diện đăng nhập
            closeModal('login-modal');
            applyLoginState(userData);
            
            // THÔNG BÁO THÀNH CÔNG
            showToast(`ACCESS GRANTED. Chào mừng trở lại, ${userData.name}!`, 'success');
            
            // Xóa trắng form cho lần sau
            userEl.value = '';
            passEl.value = '';
        } else {
            // THÔNG BÁO THẤT BẠI (Sai pass hoặc user)
            showToast('ACCESS DENIED: Sai tài khoản hoặc mật khẩu hệ thống.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('CONNECTION ERROR: Không thể kết nối tới máy chủ bảo mật.', 'error');
    }
}

function logout() {
    // XÓA DỮ LIỆU ĐĂNG NHẬP KHỎI TRÌNH DUYỆT
    localStorage.removeItem('cyber_user');
    isLoggedIn = false;
    
    document.getElementById('nav-guest').style.display = 'flex';
    document.getElementById('nav-user').style.display = 'none';
    showPage('home');
    showToast('Phiên làm việc đã kết thúc');
    
    buildRanking(); // Tải lại bảng ranking để ẩn "Vị trí của bạn"
}

// ── QUẢN LÝ SỰ KIỆN TỔNG ──
document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-action="navigate"]');
    if (navBtn) { e.preventDefault(); showPage(navBtn.dataset.target); }

    const openModalBtn = e.target.closest('[data-action="open-modal"]');
    if (openModalBtn) { e.preventDefault(); openModal(openModalBtn.dataset.target); }

    const closeModalBtn = e.target.closest('[data-action="close-modal"]');
    if (closeModalBtn) { e.preventDefault(); closeModal(closeModalBtn.dataset.target); }

    if (e.target.classList.contains('modal-backdrop')) closeModal(e.target.id);

    const faqBtn = e.target.closest('[data-action="toggle-faq"]');
    if (faqBtn) toggleFaq(faqBtn.dataset.index);
});

function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + name);
    if (el) el.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('nav-active', a.dataset.page === name));
    window.scrollTo(0, 0);
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

const defaultAvatar = "https://ui-avatars.com/api/?background=random&color=fff&name=";

// ── 1. BẢNG PROJECT & CATEGORY ──
function buildProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    // Dữ liệu trích xuất chính xác từ bảng `project`
    const projects = [
        { name: "I am a Developer", tech: "React Native, Firebase", price: "800.00", coin: 5000, desc: "An application built by React Native that simulates the life of a developer from his/her born to his/her death", date: "19/08/2024" },
        { name: "I am a Developer 2", tech: "Android, iOS", price: "700.00", coin: 4500, desc: "An application built by React Native that simulates the life of a developer...", date: "19/09/2024" },
        { name: "I am a Developer 3", tech: "Yii2 Advanced", price: "900.00", coin: 5500, desc: "An application built by React Native that simulates the life of a developer...", date: "19/08/2025" },
        { name: "I am a Developer 4", tech: "Spring Boot, Hibernate, NoSQL", price: "900.00", coin: 5000, desc: "An application built by React Native that simulates the life of a developer...", date: "18/08/2024" }
    ];

    container.innerHTML = projects.map(p => `
        <article class="group bg-surface-container-high overflow-hidden hover:border-primary/50 border border-outline-variant/10 transition-all duration-300 card-lift">
            <div class="p-6">
                <div class="flex gap-2 mb-4 flex-wrap">${p.tech.split(',').map(t => `<span class="text-[10px] font-mono px-2 py-0.5 border border-outline-variant/30 text-primary bg-primary/5">${t.trim()}</span>`).join('')}</div>
                <h3 class="text-xl font-headline font-bold mb-3 group-hover:text-primary transition-colors">${p.name}</h3>
                <p class="text-on-surface-variant text-sm leading-relaxed mb-6">${p.desc}</p>
                <div class="flex justify-between items-center border-t border-outline-variant/20 pt-4 mt-4">
                    <span class="text-xs font-mono text-on-surface-variant">Pub: ${p.date}</span>
                    <span class="text-sm font-bold text-gold">${p.coin} COINS</span>
                </div>
            </div>
        </article>
    `).join('');
}

// ── 2. BẢNG PUBLICATION ──
function buildPublications() {
    const container = document.getElementById('publications-container');
    if (!container) return;

    // Dữ liệu từ bảng `publication` bao gồm cả phần Abstract (Nội dung tóm tắt)
    const pubs = [
        { 
            title: "Hands-on Training for Mitigating Web Application Vulnerabilities.", 
            authors: "Ngo Van Quyen, Razvan Beuran", 
            year: 2023, 
            publisher: "Japan Advanced Institute of Science and Technology (JAIST)",
            abstract: "Web applications are becoming increasingly complex and interconnected, making them more vulnerable to attack. In 2022, web application attacks accounted for about 56% of all data breaches. This is due to the fact that web applications are often developed using frameworks that contain security vulnerabilities that are known to hackers. One of the most popular frameworks to build web applications is the Yii2 PHP Framework.<br><br>This research serves as a valuable resource for developers and security professionals, aiding them in fortifying the integrity of web applications by highlighting vulnerabilities, benchmarking against the OWASP Top Ten, and conducting a comprehensive evaluation of Yii2-based projects."
        },
        { 
            title: "Application of NASH equilibrium-based approach in solving the risk responses conflicts", 
            authors: "Bao-Ngoc Trinh, Quyet-Thang Huynh, Xuan-Thang Nguyen, Van-Quyen Ngo, Thanh-Trung Vu", 
            year: 2018, 
            publisher: "Journal of Science and Technology (JST)",
            abstract: "The responses to a given risk reflect the risk assessment and the organization's attitude to risk, response method to risk can cause a problem to the response method of another risk. Therefore, the project manager cannot decide which risk response will be used in case of conflicts happen. Until now, the amount of research which deals with risk responses is count-on-finger.<br><br>This paper proposes a model and the algorithm to resolve this conflict. The problem-solving model introduced below will base on Project Network and Game Theory, in which players of the game are risks, and the solution of this game is a Nash Equilibrium."
        },
        { 
            title: "My Journey to Japan", 
            authors: "Ngo Van Quyen", 
            year: 2023, 
            publisher: "Japan Science and Technology Agency (JST)",
            abstract: "[ No abstract available in the database for this specific publication. Reference external link for full content. ]"
        },
        { 
            title: "Transforming machine translation for isolating languages with multi-source neural model", 
            authors: "Nguyen Ngoc Lan, Trinh Bao Ngoc, Le Phuong Thao, Nguyen Thanh Cong, Le Manh Toan...", 
            year: 2025, 
            publisher: "Journal of Theoretical and Applied Information Technology (JATIT)",
            abstract: "Recent advancements in Artificial intelligence (AI) and Deep learning have facilitated the rapid development of machine translation technologies, among them, Neural machine translation (NMT) models have demonstrated impressive performance, especially in handling multiple language pairs. However, due to their complexity and lack of appropriate data, contemporary NMT models still have a lot of challenges when applied to isolated languages, despite their great accomplishments.<br><br>This paper proposes a multi-source neural model that employs two different encoders to process both the source word sequence and the linguistic feature sequences of isolating languages."
        }
    ];

    container.innerHTML = pubs.map(p => {
        // Biến đổi dấu nháy kép thành ký tự HTML an toàn để không làm hỏng thẻ data-content
        const safeAbstract = p.abstract.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        return `
            <div data-action="read-article" data-title="${p.title}" data-content="${safeAbstract}" 
                 class="p-6 bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-all cursor-pointer group card-lift">
                <h3 class="text-lg font-bold font-headline text-tertiary mb-2 group-hover:text-[#e4aaff] transition-colors">${p.title}</h3>
                <p class="text-sm text-on-surface mb-2 font-medium">${p.authors}</p>
                <p class="text-xs font-mono text-on-surface-variant">${p.publisher} • ${p.year}</p>
            </div>
        `;
    }).join('');
}

// ── 3. BẢNG TEAM & USER_EXPERIENCE & EDUCATION ──
function buildTeam() {
    const container = document.getElementById('team-container');
    if (!container) return;

    // Dữ liệu mix từ `team`, `user_experience`, `education`
    const team = [
        { name: "Ngô Văn Quyền", title: "MSc", nick: "The Doctor", pos: "Software Lecturer", bio: "I want to contribute to a dynamic academic and research environment...", roleColor: "text-primary" },
        { name: "Lê Mạnh Toản", title: "Mr", nick: "Tôm", pos: "Mentor", bio: "Aspiring software developer with a strong passion for programming...", roleColor: "text-primary" },
        { name: "Nguyễn Khánh Sơn", title: "MSc", nick: "Tấm", pos: "Leader", bio: "This is a demo description about Khanh Son.", roleColor: "text-tertiary" },
        { name: "Phạm Tuân", title: "Mr", nick: "Bàn Tử", pos: "Member", bio: "This is a long demo description about Pham Tuan...", roleColor: "text-gold" }
    ];

    container.innerHTML = team.map(t => `
        <div class="group bg-surface-container-low border border-outline-variant/10 overflow-hidden hover:border-primary/30 transition-all card-lift">
            <div class="aspect-square relative overflow-hidden grayscale group-hover:grayscale-0"><img class="object-cover w-full h-full" src="${defaultAvatar + t.name}" alt=""/></div>
            <div class="p-6 space-y-4">
                <div>
                    <h4 class="text-xl font-headline font-bold group-hover:${t.roleColor} transition-colors">${t.name} (${t.nick})</h4>
                    <p class="text-xs font-mono text-on-surface-variant uppercase tracking-widest mt-1">${t.pos} | ${t.title}</p>
                </div>
                <p class="text-[10px] text-on-surface-variant line-clamp-3">${t.bio}</p>
            </div>
        </div>
    `).join('');
}

// ── 4. BẢNG POLICY & FAQ ──
function buildFaqAndPolicies() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    // Từ bảng `policy`
    const policies = [
        { q: "Information We Collect", a: "Name, email, and contact details. IP address, browser type, pages visited. OAuth login data." },
        { q: "Data Sharing", a: "We do NOT sell or share your personal data with third parties unless required by law." },
        { q: "Do I need an account to use Cyb3r Web?", a: "No, but signing in with Google, GitHub, or LinkedIn gives you access to personalized features." },
        { q: "Can I delete my account?", a: "Yes. You can request account deletion by contacting our admins." }
    ];

    container.innerHTML = policies.map((item, i) => `
        <div class="border border-outline-variant/10 bg-surface-container-low overflow-hidden">
            <button data-action="toggle-faq" data-index="${i}" class="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-container-high transition-colors group">
                <span class="font-headline font-bold group-hover:text-primary transition-colors">${item.q}</span>
                <span id="faq-icon-${i}" class="material-symbols-outlined text-on-surface-variant">add</span>
            </button>
            <div id="faq-answer-${i}" class="faq-answer max-h-0 overflow-hidden transition-all duration-300">
                <div class="px-6 pb-6 pt-2 text-on-surface-variant text-sm border-t border-outline-variant/10">${item.a}</div>
            </div>
        </div>
    `).join('');
}

function toggleFaq(i) {
    const ans = document.getElementById('faq-answer-' + i);
    const icon = document.getElementById('faq-icon-' + i);
    if (!ans || !icon) return;
    
    if (ans.classList.contains('max-h-0')) {
        ans.classList.remove('max-h-0');
        ans.classList.add('max-h-[500px]');
        icon.textContent = 'remove';
    } else {
        ans.classList.add('max-h-0');
        ans.classList.remove('max-h-[500px]');
        icon.textContent = 'add';
    }
}

// ── 5. BẢNG USER & ROLE (RANKING) ──
async function buildRanking() {
    const podiumContainer = document.getElementById('podium-container');
    const listContainer = document.getElementById('ranking-list-container');
    if (!podiumContainer || !listContainer) return;

    try {
        const response = await fetch('http://localhost:8080/api/v1/ranking');
        let rankingData = [];
        if (response.ok) { rankingData = await response.json(); } 
        
        // NẾU BACKEND CHƯA CHẠY, HIỂN THỊ DỮ LIỆU BACKUP TỪ FILE SQL 
        if (!rankingData || rankingData.length === 0) {
            rankingData = [
                {name: "Ngô Văn Quyền", role: "Super Admin", point: 0},
                {name: "Lê Mạnh Toản", role: "Admin", point: 0},
                {name: "Vũ Thị Xuân", role: "Researcher", point: 0},
                {name: "Nguyễn Khánh Sơn", role: "Leader", point: 0},
                {name: "Phạm Tuân", role: "Member", point: 0}
            ];
        }

        const top1 = rankingData[0] || null; const top2 = rankingData[1] || null; const top3 = rankingData[2] || null;
        let podiumHTML = '';
        
        if(top2) podiumHTML += `<div class="p-6 border border-primary/30 bg-primary/5 text-center relative card-lift md:order-1 order-2 md:h-[90%] flex flex-col justify-end"><div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-[#0d6100] font-headline font-bold flex items-center justify-center rounded-full">2</div><img src="${defaultAvatar + top2.name}" class="w-20 h-20 mx-auto border-2 border-primary mb-4 object-cover"/><h3 class="font-headline font-bold text-lg text-white">${top2.name}</h3><p class="text-[10px] font-mono text-primary uppercase tracking-widest mb-4">${top2.role}</p><div class="text-2xl font-mono font-bold text-white">${top2.point.toLocaleString()} <span class="text-[10px] text-on-surface-variant font-sans">PTS</span></div></div>`;
        if(top1) podiumHTML += `<div class="p-8 border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-center relative card-lift md:order-2 order-1 z-10 shadow-lg"><div class="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#D4AF37] text-black font-headline font-bold text-lg flex items-center justify-center rounded-full">1</div><img src="${defaultAvatar + top1.name}" class="w-28 h-28 mx-auto border-2 border-[#D4AF37] mb-4 object-cover"/><h3 class="font-headline font-bold text-2xl text-[#D4AF37]">${top1.name}</h3><p class="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest mb-4">${top1.role}</p><div class="text-3xl font-mono font-bold text-white">${top1.point.toLocaleString()} <span class="text-[10px] text-on-surface-variant font-sans">PTS</span></div></div>`;
        if(top3) podiumHTML += `<div class="p-6 border border-tertiary/30 bg-tertiary/5 text-center relative card-lift md:order-3 order-3 md:h-[80%] flex flex-col justify-end"><div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-tertiary text-[#390050] font-headline font-bold flex items-center justify-center rounded-full">3</div><img src="${defaultAvatar + top3.name}" class="w-16 h-16 mx-auto border-2 border-tertiary mb-4 object-cover"/><h3 class="font-headline font-bold text-lg text-white">${top3.name}</h3><p class="text-[10px] font-mono text-tertiary uppercase tracking-widest mb-4">${top3.role}</p><div class="text-2xl font-mono font-bold text-white">${top3.point.toLocaleString()} <span class="text-[10px] text-on-surface-variant font-sans">PTS</span></div></div>`;

        podiumContainer.innerHTML = podiumHTML;

        let listHTML = '';
        for(let i = 3; i < rankingData.length; i++) {
            listHTML += `<div class="flex items-center justify-between px-6 py-4 hover:bg-surface-bright/30 transition-colors"><div class="flex items-center gap-6"><span class="font-mono text-lg font-bold text-on-surface-variant w-6 text-center">${(i+1).toString().padStart(2, '0')}</span><div class="flex items-center gap-3"><img src="${defaultAvatar + rankingData[i].name}" class="w-8 h-8"/><div><p class="text-sm font-medium text-white">${rankingData[i].name}</p><p class="text-[10px] font-mono text-on-surface-variant uppercase">${rankingData[i].role}</p></div></div></div><div class="font-mono font-bold text-sm text-white">${rankingData[i].point.toLocaleString()} PTS</div></div>`;
        }
        listContainer.innerHTML = listHTML;
    } catch (e) {}
}

// Bảng Admin (Hiển thị User)
function buildAdminTable() {
    const tbody = document.getElementById('admin-table');
    if (!tbody) return;
    const users = [
        {name: "Ngô Văn Quyền", role: "Super Admin", email: "nvquyen2404@gmail.com"},
        {name: "Lê Mạnh Toản", role: "Admin", email: "lemanhtoan2003@gmail.com"},
        {name: "Vũ Thị Xuân", role: "Researcher", email: "xuantae1030@gmail.com"},
        {name: "Sale Manager", role: "Sale Manager", email: "sale.manager@gmail.com"}
    ];
    tbody.innerHTML = users.map(u => `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-bright/30"><td class="px-6 py-4 flex items-center gap-3"><img src="${defaultAvatar + u.name}" class="w-8 h-8"/><div><div class="text-sm font-medium">${u.name}</div><div class="text-xs text-on-surface-variant">${u.email}</div></div></td><td class="px-6 py-4 text-xs font-mono uppercase">${u.role}</td><td class="px-6 py-4 text-xs text-primary uppercase">Active</td></tr>
    `).join('');
}