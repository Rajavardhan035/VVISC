// ==========================================
// VVISC Admin Testimonials
// ==========================================

requireRole("admin");

// ==========================================
// Variables
// ==========================================

let currentFilter = "all";
let searchText = "";
let unsubscribe = null;

// ==========================================
// Elements
// ==========================================

const pendingContainer =
document.getElementById("pendingReviews");

const approvedContainer =
document.getElementById("approvedReviews");

const pendingCount =
document.getElementById("pendingCount");

const approvedCount =
document.getElementById("approvedCount");

const searchBox =
document.getElementById("searchReview");

const filterButtons =
document.querySelectorAll(".filter-btn");

// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadTestimonials();

});

// ==========================================
// Search
// ==========================================

searchBox.addEventListener("input", () => {

    searchText =
    searchBox.value.trim().toLowerCase();

    loadTestimonials();

});

// ==========================================
// Filter
// ==========================================

filterButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        filterButtons.forEach(button =>

            button.classList.remove("active")

        );

        btn.classList.add("active");

        currentFilter =
        btn.dataset.filter;

        loadTestimonials();

    });

});

// ==========================================
// Load Testimonials
// ==========================================

function loadTestimonials(){

    if(unsubscribe){

        unsubscribe();

    }

    unsubscribe = db
    .collection("testimonials")
    .orderBy("createdAt","desc")
    .onSnapshot(snapshot => {

        pendingContainer.innerHTML = "";

        approvedContainer.innerHTML = "";

        let pending = 0;

        let approved = 0;

        if(snapshot.empty){

            pendingContainer.innerHTML = `

                <div class="empty-card">

                    No testimonials available.

                </div>

            `;

            approvedContainer.innerHTML = `

                <div class="empty-card">

                    No testimonials available.

                </div>

            `;

            pendingCount.innerText = 0;

            approvedCount.innerText = 0;

            return;

        }

        snapshot.forEach(doc => {

            const data = doc.data();

            const matchesSearch =

                (data.name || "")
                .toLowerCase()
                .includes(searchText)

                ||

                (data.email || "")
                .toLowerCase()
                .includes(searchText);

            if(!matchesSearch)
                return;

            if(

                currentFilter !== "all"

                &&

                data.status !== currentFilter

            )

                return;

            const card =
            reviewCard(doc.id,data);

            if(data.status === "approved"){

                approved++;

                approvedContainer.insertAdjacentHTML(

                    "beforeend",

                    card

                );

            }

            else{

                pending++;

                pendingContainer.insertAdjacentHTML(

                    "beforeend",

                    card

                );

            }

        });

        if(pending===0){

            pendingContainer.innerHTML =

            `

            <div class="empty-card">

                No pending testimonials.

            </div>

            `;

        }

        if(approved===0){

            approvedContainer.innerHTML =

            `

            <div class="empty-card">

                No approved testimonials.

            </div>

            `;

        }

        pendingCount.innerText = pending;

        approvedCount.innerText = approved;

    },

    error => {

        console.error(error);

        alert(error.message);

    });

}

// ==========================================
// Review Card
// ==========================================

function reviewCard(id,data){

return `

<div class="review-card" data-status="${data.status === "approved" ? "approved" : "pending"}">

    <div class="review-top">

        <div class="review-info">

            <div class="review-name">

                ${data.name || "Unknown"}

            </div>

            <div class="review-course">

                ${data.department || "-"}

                •

                ${data.year || "-"}

            </div>

            <div class="review-badge">

                ${
                    data.status==="approved"

                    ? "✅ Approved"

                    : "⏳ Pending"
                }

            </div>

        </div>

    </div>

    <div class="review-stars">

        ${generateStars(data.rating)}

    </div>

    <div class="review-text">

        "${data.review}"

    </div>

    <div class="review-email">

        📧 ${data.email}

    </div>

    <div class="review-status">

        Status :
        <strong>${data.status}</strong>

    </div>

    <div class="review-actions">

        ${
            data.status==="pending"

            ?

            `

            <button
                class="approve-btn"
                onclick="approveReview('${id}')">

                ✅ Approve

            </button>

            <button
                class="reject-btn"
                onclick="rejectReview('${id}')">

                ❌ Reject

            </button>

            `

            :

            `

            <button
                class="pending-btn"
                onclick="movePending('${id}')">

                ⏳ Move to Pending

            </button>

            `

        }

        <button
            class="delete-btn"
            onclick="deleteReview('${id}')">

            🗑 Delete

        </button>

    </div>

</div>

`;

}

// ==========================================
// Stars
// ==========================================

function generateStars(rating){

    rating = Math.max(

        0,

        Math.min(

            Number(rating)||0,

            5

        )

    );

    let html = "";

    for(let i=1;i<=5;i++){

        html += i<=rating ? "★" : "☆";

    }

    return html;

}
// ==========================================
// Approve Review
// ==========================================

async function approveReview(id){

    try{

        await db
        .collection("testimonials")
        .doc(id)
        .update({

            status: "approved"

        });

        showToast("Review approved successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Move Back To Pending
// ==========================================

async function movePending(id){

    try{

        await db
        .collection("testimonials")
        .doc(id)
        .update({

            status: "pending"

        });

        showToast("Review moved to pending.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Reject Review
// ==========================================

async function rejectReview(id){

    const confirmReject = confirm(

        "Are you sure you want to reject this review?"

    );

    if(!confirmReject)
        return;

    try{

        await db
        .collection("testimonials")
        .doc(id)
        .delete();

        showToast("Review rejected successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Delete Review
// ==========================================

async function deleteReview(id){

    const confirmDelete = confirm(

        "Delete this review permanently?"

    );

    if(!confirmDelete)
        return;

    try{

        await db
        .collection("testimonials")
        .doc(id)
        .delete();

        showToast("Review deleted successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Toast Message — provided by ui.js (showToast)
// ==========================================
// Cleanup
// ==========================================

window.addEventListener("beforeunload",()=>{

    if(unsubscribe){

        unsubscribe();

    }

});