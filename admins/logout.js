// =========================================
// Logout
// =========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!confirm("Logout from VVISC Admin Panel?"))
            return;

        try {
            await auth.signOut();
        } catch (err) {
            console.warn("Sign out error:", err);
        }

        localStorage.clear();

        window.location.href = "../login.html";

    });

}