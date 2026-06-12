const cards = document.querySelectorAll(".card");

cards.forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.transform="translateY(-10px) scale(1.03)";

});

card.addEventListener("mouseleave",()=>{

card.style.transform="translateY(0) scale(1)";

});

});
window.addEventListener("scroll",()=>{

let scrolled = window.pageYOffset;

document.querySelector(".hero").style.backgroundPositionY =
(scrolled * 0.5) + "px";

});
