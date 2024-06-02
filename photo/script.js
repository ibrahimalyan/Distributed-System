const search_user = document.getElementById('searchInput');
const image_component= document.getElementById('imageResults');
const button_load = document.getElementById('loadMoreBtn');
let currentPage = 0;
let currentQuery = '';

search_user.addEventListener('input', () => {
    const query = search_user.value.trim();
    if (query.length >= 3) {
        currentPage = 1;
        currentQuery = query;
        image_component.innerHTML = '';
        searchImages(query, currentPage);
    } else {
        image_component.innerHTML = '';
        button_load.style.display = 'none';
    }
});

button_load.addEventListener('click', () => {
    currentPage++;
    searchImages(currentQuery, currentPage);
});

async function searchImages(query, page) {
    const clientId = '18OerCUXhFCbPipqd27WL84AXgm3AQJojY2zoFM0TSM';  // Replace with your Unsplash client ID
    const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${clientId}&per_page=20&page=${page}`;
    
    $.ajax({
        url: url,
        method: 'GET',
        success: function(data) {
            displayImages(data.results);
            if (page < data.total_pages) {
                button_load.style.display = 'block';
            } else {
                button_load.style.display = 'none';
            }
        },
        error: function(error) {
            console.error('Error fetching images:', error);
        }
    });
}

function displayImages(images) {
    images.forEach(image => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = image.urls.thumb;
        img.alt = image.alt_description;
        
        const detailsBtn = document.createElement('button');
        detailsBtn.textContent = 'View Details';
        detailsBtn.addEventListener('click', () => {
            alert(`Title: ${image.description || 'N/A'}\nDescription: ${image.alt_description || 'N/A'}\nLikes: ${image.likes}`);
        });
        
        imageCard.appendChild(img);
        imageCard.appendChild(detailsBtn);
        imageResults.appendChild(imageCard);
    });
}
