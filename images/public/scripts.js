$(document).ready(function() {
    let currentProjectId = null;
    let teamMemberCounter = 1;
    let selectedImage = null;
    let sortOrder = {
        projectName: false,
        managerName: false,
        startDate: true // Default to descending for start date
    };

    // Function to display the Add Project form
    $('#addProjectBtn').click(function() {
        currentProjectId = null;
        resetForm();
        $('#addProjectForm').show();
    });

    // Function to reset the form
    function resetForm() {
        $('#projectForm')[0].reset();
        $('#teamMembers').html(`
            <div class="team-member">
                <label for="teamMemberName0">Name:</label>
                <input type="text" id="teamMemberName0" class="teamMemberName" name="teamMemberName0" required>
                
                <label for="teamMemberEmail0">Email:</label>
                <input type="email" id="teamMemberEmail0" class="teamMemberEmail" name="teamMemberEmail0" required>
                
                <label for="teamMemberRole0">Role:</label>
                <input type="text" id="teamMemberRole0" class="teamMemberRole" name="teamMemberRole0" required>
            </div>
        `);
        teamMemberCounter = 1; // Reset the counter
    }

    // Function to add a new team member input group
    $('#addTeamMemberBtn').click(function() {
        const teamMemberHtml = `
            <div class="team-member">
                <label for="teamMemberName${teamMemberCounter}">Name:</label>
                <input type="text" id="teamMemberName${teamMemberCounter}" class="teamMemberName" name="teamMemberName${teamMemberCounter}" required>
                
                <label for="teamMemberEmail${teamMemberCounter}">Email:</label>
                <input type="email" id="teamMemberEmail${teamMemberCounter}" class="teamMemberEmail" name="teamMemberEmail${teamMemberCounter}" required>
                
                <label for="teamMemberRole${teamMemberCounter}">Role:</label>
                <input type="text" id="teamMemberRole${teamMemberCounter}" class="teamMemberRole" name="teamMemberRole${teamMemberCounter}" required>
            </div>
        `;
        $('#teamMembers').append(teamMemberHtml);
        teamMemberCounter++;
    });

   // Function to load and display the project list
    function loadProjects() {
        $.ajax({
            url: '/projects',
            method: 'GET',
            success: function(response) {
                if (typeof response === 'object' && !Array.isArray(response)) {
                    // Convert object to array
                    const projects = Object.values(response).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

                    const projectList = projects.map(project => `
                        <tr>
                            <td>${project.id}</td>
                            <td>${project.name}</td>
                            <td>${project.manager.name}</td>
                            <td>${new Date(project.start_date).toLocaleDateString()}</td>
                            <td>${project.summary}</td>
                            <td>
                                <button class="editProjectBtn" data-id="${project.id}">Edit</button>
                                <button class="deleteProjectBtn" data-id="${project.id}">Delete</button>
                                <button class="addImageBtn" data-id="${project.id}">Add Image</button>
                                <button class="viewImagesBtn" data-id="${project.id}">View Images</button>
                            </td>
                        </tr>
                    `).join('');
                    $('#projectList tbody').html(projectList);
                } else {
                    console.error('Unexpected response format:', response);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load projects:', error);
            }
        });
    }


    // Load projects on page load
    loadProjects();

    // Function to handle the Add/Edit Project form submission
    $('#projectForm').submit(function(event) {
        event.preventDefault();

        const projectData = {
            name: $('#projectName').val(),
            summary: $('#projectDescription').val(),
            manager: {
                name: $('#managerName').val(),
                email: $('#managerEmail').val()
            },
            start_date: $('#startDate').val(),
            team: $('.team-member').map(function() {
                return {
                    name: $(this).find('.teamMemberName').val(),
                    email: $(this).find('.teamMemberEmail').val(),
                    role: $(this).find('.teamMemberRole').val()
                };
            }).get()
        };

        const method = currentProjectId ? 'PUT' : 'POST';
        const url = currentProjectId ? `/projects/${currentProjectId}` : '/projects';

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(projectData),
            success: function(response) {
                alert(`Project ${currentProjectId ? 'updated' : 'added'} successfully!`);
                $('#addProjectForm').hide();
                loadProjects();
            },
            error: function(xhr, status, error) {
                alert(`Failed to ${currentProjectId ? 'update' : 'add'} project: ${xhr.responseJSON.error}`);
            }
        });
    });

    // Event delegation for Edit and Delete buttons
    $('#projectList').on('click', '.editProjectBtn', function() {
        currentProjectId = $(this).data('id');
        $.ajax({
            url: `/projects/${currentProjectId}`,
            method: 'GET',
            success: function(project) {
                $('#projectName').val(project.name);
                $('#projectDescription').val(project.summary);
                $('#managerName').val(project.manager.name);
                $('#managerEmail').val(project.manager.email);
                $('#startDate').val(new Date(project.start_date).toISOString().split('T')[0]);
                
                $('#teamMembers').html('');
                project.team.forEach((member, index) => {
                    const teamMemberHtml = `
                        <div class="team-member">
                            <label for="teamMemberName${index}">Name:</label>
                            <input type="text" id="teamMemberName${index}" class="teamMemberName" name="teamMemberName${index}" value="${member.name}" required>
                            
                            <label for="teamMemberEmail${index}">Email:</label>
                            <input type="email" id="teamMemberEmail${index}" class="teamMemberEmail" name="teamMemberEmail${index}" value="${member.email}" required>
                            
                            <label for="teamMemberRole${index}">Role:</label>
                            <input type="text" id="teamMemberRole${index}" class="teamMemberRole" name="teamMemberRole${index}" value="${member.role}" required>
                        </div>
                    `;
                    $('#teamMembers').append(teamMemberHtml);
                });

                $('#addProjectForm').show();
            },
            error: function(xhr, status, error) {
                console.error('Failed to load project details:', error);
                alert('Failed to load project details: ' + xhr.responseJSON.error);
            }
        });
    });

    $('#projectList').on('click', '.deleteProjectBtn', function() {
        const projectId = $(this).data('id');

        $.ajax({
            url: `/projects/${projectId}`,
            method: 'DELETE',
            success: function() {
                alert('Project deleted successfully!');
                loadProjects();
            },
            error: function(xhr, status, error) {
                alert('Failed to delete project: ' + xhr.responseJSON.error);
            }
        });
    });

    // Add image functionality
    $('#projectList').on('click', '.addImageBtn', function() {
        currentProjectId = $(this).data('id');
        $('#addImageForm').show();
    });
    $('#searchImageBtn').click(function() {
        const query = $('#imageQuery').val();
        if (!query) {
            alert('Please enter a search query');
            return;
        }
        $.ajax({
            url: '/unsplash',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query: query }),
            success: function(images) {
                const imageResults = images.map(image => `
                    <div class="image-item">
                        <img src="${image.thumb_url}" data-id="${image.id}" data-name="${image.name}" data-description="${image.description}" class="image-item">
                        <p>Name: ${image.name}</p>
                        <p>Description: ${image.description}</p>
                    </div>
                `).join('');
                $('#imageResults').html(imageResults);
            },
            error: function(xhr, status, error) {
                console.error('Failed to search images:', error);
                alert('Failed to search images: ' + xhr.responseJSON.error);
            }
        });
    });

    $('#imageResults').on('click', 'img', function() {
        $('#imageResults img').removeClass('selected');
        $(this).addClass('selected');
        selectedImage = {
            thumb_url: $(this).attr('src'),
            name: $(this).data('name'),
            description: $(this).data('description')
        };
    });

    $('#imageForm').submit(function(event) {
        event.preventDefault();
        if (!selectedImage) {
            alert('Please select an image');
            return;
        }

        const imageData = {
            thumb_url: selectedImage.thumb_url,
            name: selectedImage.name,
            description: selectedImage.description
        };

        $.ajax({
            url: `/projects/${currentProjectId}/images`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(imageData),
            success: function() {
                alert('Image added successfully!');
                $('#addImageForm').hide();
            },
            error: function(xhr, status, error) {
                console.error('Failed to add image:', xhr.responseText);
                alert('Failed to add image: ' + xhr.responseText);
            }
        });
    });

     // View images functionality
     $('#projectList').on('click', '.viewImagesBtn', function() {
        currentProjectId = $(this).data('id');
        $('#viewImagesContainer').show();
        $.ajax({
            url: `/projects/${currentProjectId}`,
            method: 'GET',
            success: function(project) {
                const imageList = project.images.map(image => `
                    <div class="image-item">
                        <img src="${image.thumb}" alt="${image.description}">
                        <p>${image.description}</p>
                        <button class="deleteImageBtn" data-id="${image.id}">Delete</button>
                    </div>
                `).join('');
                $('#imageList').html(imageList);
            },
            error: function(xhr, status, error) {
                console.error('Failed to load project images:', error);
                alert('Failed to load project images: ' + xhr.responseJSON.error);
            }
        });
    });

    $('#imageList').on('click', '.deleteImageBtn', function() {
        const imageId = $(this).data('id');

        $.ajax({
            url: `/projects/${currentProjectId}/images/${imageId}`,
            method: 'DELETE',
            success: function() {
                alert('Image deleted successfully!');
                $(`#imageList .image-item:has(button[data-id="${imageId}"])`).remove();
            },
            error: function(xhr, status, error) {
                console.error('Failed to delete image:', error);
            }
        });
    });

    // Sort project list
    function sortTable(columnIndex, order) {
        const table = document.querySelector('#projectList table tbody');
        const rows = Array.from(table.rows);
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].innerText.toLowerCase();
            const bText = b.cells[columnIndex].innerText.toLowerCase();
            if (aText < bText) {
                return order ? -1 : 1;
            }
            if (aText > bText) {
                return order ? 1 : -1;
            }
            return 0;
        });
        rows.forEach(row => table.appendChild(row));
    }

    // Default sort by start date descending
    sortTable(3, sortOrder.startDate);

    

    $('#sortByName').click(() => {
        sortOrder.projectName = !sortOrder.projectName;
        sortTable(1, sortOrder.projectName);
    });

    $('#sortByManager').click(() => {
        sortOrder.managerName = !sortOrder.managerName;
        sortTable(2, sortOrder.managerName);
    });

    $('#sortByStartDate').click(() => {
        sortOrder.startDate = !sortOrder.startDate;
        sortTable(3, sortOrder.startDate);
    });

    // Modal functionality
    var modal = document.getElementById("imageModal");
    var modalImage = document.getElementById("modalImage");

    $('#imageList').on('click', 'img', function() {
        var src = $(this).attr('src');
        modalImage.src = src;
        modal.style.display = "block";
    });

    $('.close').click(function() {
        modal.style.display = "none";
    });

    $(window).click(function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});
