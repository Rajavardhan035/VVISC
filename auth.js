// ============================================
// VVISC Auth Logic (Firebase)
// Shared by login.html and signup.html.
// Requires firebase-config.js to be loaded first.
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    const showError = (formEl, message) => {
        let errorEl = formEl.querySelector('.auth-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-status error is-visible auth-error';
            formEl.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.className = 'form-status error is-visible auth-error';
    };

    const showSuccess = (formEl, message) => {
        let errorEl = formEl.querySelector('.auth-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-status success is-visible auth-error';
            formEl.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.className = 'form-status success is-visible auth-error';
    };

    const friendlyError = (error) => {
        const map = {
            'auth/invalid-email': 'That email address looks invalid.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with that email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account already exists with that email.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
            'auth/network-request-failed': 'Network error — check your connection and try again.'
        };
        return map[error.code] || error.message || 'Something went wrong. Please try again.';
    };

    /* ============================================
       Login Form
       ============================================ */
    const loginForm = document.getElementById('login-form');
    if (loginForm && typeof auth !== 'undefined') {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    showSuccess(loginForm, 'Logged in successfully — redirecting...');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                })
                .catch((error) => {
                    showError(loginForm, friendlyError(error));
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Login';
                    }
                });
        });
    }

    /* ============================================
       Sign Up Form
       ============================================ */
    const signupForm = document.getElementById('signup-form');
    if (signupForm && typeof auth !== 'undefined') {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    return userCredential.user.updateProfile({ displayName: name });
                })
                .then(() => {
                    showSuccess(signupForm, 'Account created — redirecting...');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                })
                .catch((error) => {
                    showError(signupForm, friendlyError(error));
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Account';
                    }
                });
        });
    }

    /* ============================================
       Google Sign-In (used on both pages)
       ============================================ */
    const googleBtns = document.querySelectorAll('.auth-google-btn');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof auth === 'undefined') return;
            const provider = new firebase.auth.GoogleAuthProvider();
            const formEl = btn.closest('.auth-form') || btn.closest('.auth-form-panel');

            auth.signInWithPopup(provider)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (formEl) showError(formEl, friendlyError(error));
                });
        });
    });

    /* ============================================
       Password visibility toggle
       ============================================ */
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = document.getElementById(toggle.dataset.target);
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            toggle.classList.toggle('is-visible');
        });
    });

});
