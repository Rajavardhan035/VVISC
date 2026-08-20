// =========================================
// Logout
// =========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (!confirm("Logout from VVISC Admin Panel?"))
            return;

        await auth.signOut();

        localStorage.clear();

        window.location.href = "../login.html";

    });

}