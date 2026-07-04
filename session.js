// session.js

firebase.auth().onAuthStateChanged((user) => {

    const page = window.location.pathname.split("/").pop();

    // Pages that require login
    const protectedPages = [
        "dashboard.html",
        "profile.html"
    ];

    // Redirect logged-in users away from Login & Signup
    if (user && (page === "login.html" || page === "signup.html")) {
        window.location.href = "index.html";
        return;
    }

    // Redirect logged-out users from protected pages
    if (!user && protectedPages.includes(page)) {
        window.location.href = "login.html";
        return;
    }

    const loginBtn = document.querySelector(".nav-login-btn");

    if (!loginBtn) return;

    // =============================
    // USER LOGGED IN
    // =============================
    if (user) {

        loginBtn.outerHTML = `
            <div class="profile-menu">
                <button class="profile-btn" id="profileBtn">
                    ${user.displayName || user.email}
                    <span class="arrow">▼</span>
                </button>

                <div class="dropdown-menu" id="dropdownMenu">
                    <a href="profile.html">👤 My Profile</a>
                    <a href="#">📅 My Events</a>
                    <a href="#">⚙️ Settings</a>
                    <hr>
                    <a href="#" id="logoutBtn">🚪 Logout</a>
                </div>
            </div>
        `;

        const profileBtn = document.getElementById("profileBtn");
        const dropdownMenu = document.getElementById("dropdownMenu");
        const logoutBtn = document.getElementById("logoutBtn");

        // Open / Close dropdown
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle("show");
        });

        // Close when clicking outside
        document.addEventListener("click", () => {
            dropdownMenu.classList.remove("show");
        });

        // Prevent menu from closing when clicking inside it
        dropdownMenu.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Logout
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();

            firebase.auth().signOut()
                .then(() => {
                    window.location.href = "login.html";
                })
                .catch((error) => {
                    console.error(error);
                });
        });

    }

    // =============================
    // USER NOT LOGGED IN
    // =============================
    else {

        loginBtn.textContent = "Login";
        loginBtn.href = "login.html";

    }

}); 
