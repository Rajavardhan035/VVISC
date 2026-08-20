// ======================================================
// VVISC Testimonials
// Part 1
// ======================================================

// --------------------------------------
// Global Variables
// --------------------------------------

let selectedRating = 0;

// --------------------------------------
// Elements
// --------------------------------------

const reviewForm = document.getElementById("testimonialForm");

const testimonialContainer =
document.getElementById("testimonialContainer");

const reviewCount =
document.getElementById("reviewCount");

const averageRating =
document.getElementById("averageRating");

const stars =
document.querySelectorAll("#ratingStars span");

const reviewModal =
document.getElementById("reviewModal");

const openReviewModal =
document.getElementById("openReviewModal");

const closeReviewModal =
document.getElementById("closeReviewModal");

const submitBtn =
document.getElementById("submitReviewBtn");

const successModal =
document.getElementById("successModal");

const closeSuccess =
document.getElementById("closeSuccess");

// --------------------------------------
// Modal Functions
// --------------------------------------

function openModal(){

    if(!reviewModal) return;

    reviewModal.classList.add("active");

    document.body.style.overflow="hidden";

}

function closeModal(){

    if(!reviewModal) return;

    reviewModal.classList.remove("active");

    document.body.style.overflow="";

}

// --------------------------------------
// Open / Close Events
// --------------------------------------

if(openReviewModal){

    openReviewModal.addEventListener("click",openModal);

}

if(closeReviewModal){

    closeReviewModal.addEventListener("click",closeModal);

}

if(reviewModal){

    reviewModal.addEventListener("click",(e)=>{

        if(e.target===reviewModal){

            closeModal();

        }

    });

}

// --------------------------------------
// Success Modal
// --------------------------------------

function showSuccess(){

    if(successModal){

        successModal.classList.add("show");

    }

}

function hideSuccess(){

    if(successModal){

        successModal.classList.remove("show");

    }

}

if(closeSuccess){

    closeSuccess.addEventListener("click",hideSuccess);

}

// --------------------------------------
// Star Rating
// --------------------------------------

stars.forEach(star=>{

    star.addEventListener("click",()=>{

        selectedRating =
        Number(star.dataset.rating);

        stars.forEach(s=>{

            if(Number(s.dataset.rating)<=selectedRating){

                s.classList.add("active");

            }

            else{

                s.classList.remove("active");

            }

        });

    });

});

// --------------------------------------
// Loading Button
// --------------------------------------

function startLoading(){

    if(!submitBtn) return;

    submitBtn.disabled=true;

    submitBtn.innerHTML=`

        <span class="loader"></span>

        Submitting...

    `;

}

function stopLoading(){

    if(!submitBtn) return;

    submitBtn.disabled=false;

    submitBtn.innerHTML="Submit Review";

}

// --------------------------------------
// Reset Form
// --------------------------------------

function resetReviewForm(){

    reviewForm.reset();

    selectedRating=0;

    stars.forEach(star=>{

        star.classList.remove("active");

    });

}

// --------------------------------------
// Submit Review
// --------------------------------------

if(reviewForm){

reviewForm.addEventListener("submit",submitReview);

}

async function submitReview(e){

e.preventDefault();

if(selectedRating===0){

alert("Please select a rating.");

return;

}

startLoading();

try{

await db.collection("testimonials").add({

name:
document.getElementById("name").value.trim(),

email:
document.getElementById("email").value.trim(),

department:
document.getElementById("department").value.trim(),

year:
document.getElementById("year").value.trim(),

review:
document.getElementById("review").value.trim(),

rating:selectedRating,

status:"pending",

createdAt:
firebase.firestore.FieldValue.serverTimestamp()

});

stopLoading();

closeModal();

showSuccess();

resetReviewForm();

}
catch(error){

console.error(error);

stopLoading();

alert("Failed to submit review.");

}

}
// ======================================================
// PART 2
// Load Approved Reviews (Live)
// ======================================================

loadTestimonials();

function loadTestimonials() {

    if (!testimonialContainer) return;

    db.collection("testimonials")
        .where("status", "==", "approved")
        .orderBy("createdAt", "desc")
        .onSnapshot(

            (snapshot) => {

                testimonialContainer.innerHTML = "";

                // ----------------------------------
                // Empty State
                // ----------------------------------

                if (snapshot.empty) {

                    testimonialContainer.innerHTML = `

                    <div class="empty-reviews">

                        <h3>

                            No Reviews Yet

                        </h3>

                        <p>

                            Be the first student to share your
                            VVISC experience.

                        </p>

                    </div>

                    `;

                    if (reviewCount)
                        reviewCount.innerText = "0";

                    if (averageRating)
                        averageRating.innerText = "0.0";

                    return;

                }

                let totalRating = 0;

                snapshot.forEach((doc) => {

                    const data = doc.data();

                    totalRating += Number(data.rating);

                    const reviewDate = formatDate(
                        data.createdAt
                    );

                    testimonialContainer.innerHTML += `

<div class="testimonial-card">

    <div class="testimonial-header">

        <div class="testimonial-avatar">

            ${data.name.charAt(0).toUpperCase()}

        </div>

        <div>

            <div class="testimonial-name">

                ${data.name}

            </div>

            <div class="testimonial-department">

                ${data.department}
                •

                ${data.year}

            </div>

        </div>

    </div>

    <div class="testimonial-stars">

        ${generateStars(data.rating)}

    </div>

    <div class="testimonial-text">

        "${escapeHtml(data.review)}"

    </div>

    <div class="testimonial-footer">

        <span class="review-date">

            ${reviewDate}

        </span>

        <span class="verified-badge">

            ✔ Approved

        </span>

    </div>

</div>

`;

                });

                if (reviewCount) {

                    reviewCount.innerText =
                        snapshot.size;

                }

                if (averageRating) {

                    averageRating.innerText =
                        (
                            totalRating /
                            snapshot.size
                        ).toFixed(1);

                }

            },

            (error) => {

                console.error(error);

                testimonialContainer.innerHTML = `

<div class="empty-reviews">

    <h3>

        Unable to Load Reviews

    </h3>

    <p>

        Please try again later.

    </p>

</div>

`;

            }

        );

}
// ======================================================
// PART 3
// Helper Functions & Featured Review
// ======================================================

// --------------------------------------
// Generate Stars
// --------------------------------------

function generateStars(rating) {

    rating = Number(rating) || 0;

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        stars += i <= rating ? "★" : "☆";

    }

    return stars;

}

// --------------------------------------
// Escape HTML
// Prevents HTML Injection
// --------------------------------------

function escapeHtml(text) {

    if (!text) return "";

    const div = document.createElement("div");

    div.innerText = text;

    return div.innerHTML;

}

// --------------------------------------
// Format Firestore Timestamp
// --------------------------------------

function formatDate(timestamp) {

    if (!timestamp) {

        return "Recently";

    }

    try {

        const date = timestamp.toDate();

        return date.toLocaleDateString("en-IN", {

            day: "numeric",

            month: "short",

            year: "numeric"

        });

    }

    catch {

        return "Recently";

    }

}

// ======================================================
// Featured Review
// ======================================================

loadFeaturedReview();

function loadFeaturedReview() {

    const featuredText =
        document.querySelector(".featured-review-text");

    const featuredName =
        document.querySelector(".featured-author h3");

    const featuredDept =
        document.querySelector(".featured-author span");

    const featuredAvatar =
        document.querySelector(".author-avatar");

    if (
        !featuredText ||
        !featuredName ||
        !featuredDept ||
        !featuredAvatar
    ) {

        return;

    }

    db.collection("testimonials")
        .where("status", "==", "approved")
        .limit(10)
        .get()

        .then(snapshot => {

            if (snapshot.empty) return;

            const docs = snapshot.docs.map(doc => doc.data());
            docs.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
            const data = docs[0];

            featuredText.innerHTML =

                `"${escapeHtml(data.review)}"`;

            featuredName.innerText =
                data.name;

            featuredDept.innerText =
                `${data.department} • ${data.year}`;

            featuredAvatar.innerText =
                data.name.charAt(0).toUpperCase();

        })

        .catch(error => {

            console.error(error);

        });

}

// ======================================================
// Auto Refresh Statistics
// ======================================================

setInterval(() => {

    loadFeaturedReview();

}, 60000);

// ======================================================
// Console
// ======================================================

console.log(
    "%cVVISC Testimonials Loaded",
    "color:#205CFF;font-size:16px;font-weight:bold;"
);