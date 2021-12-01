"use strict";
(function(){
    window.addEventListener("load", init);

    const id = document.getElementById.bind(document);
    const qs = document.querySelector.bind(document);
    const qsa = document.querySelectorAll.bind(document);

    function init() {
        let modal = qs(".modal");
        requestImages();
        modal.addEventListener("click", () => {modal.classList.add("hidden")});
    }

    function requestImages() {
        fetch("data/gallery.json")
            .then(checkStatus)
            .then(res => res.json())
            .then(populateImages)
            .catch(console.error);

    }

    function populateImages(data) {
        let gallery = id("gallery");
        data.forEach(art => {
            let frame = generateImage(art);
            gallery.appendChild(frame);
        });
    }

    function generateImage(art) {
        let container = document.createElement("div");
        container.classList.add(art.size);
        let img = document.createElement("img");
        img.src = `images/art/${art.path}`;
        img.alt = art.name;
        img.addEventListener("click", openModal);
        let title = document.createElement("h2");
        title.textContent = art.name;
        let hr = document.createElement("hr");
        let date = document.createElement("p");
        date.textContent = art.date;

        container.appendChild(img);
        container.appendChild(title);
        container.appendChild(hr);
        container.appendChild(date);

        return container;
    }

    function openModal() {
        let modal = qs(".modal");
        let img = modal.querySelector("img");
        img.src = this.src;
        img.alt = this.alt;
        modal.classList.remove("hidden");
    }

    function checkStatus(response) {
        if(response.ok) {
            return response;
        } else {
            throw Error("Error in request: " + response.statusText);
        }
    }
})();