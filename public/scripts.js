$(document).ready(function() {
    let currentProjectId = null;
    let teamMemberCounter = 1;
    let selectedImage = null;

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
            success: function(projects) {
                const projectList = projects.map(project => `
                    <tr>
                        <td>${project.id}</td>
                        <td>${project.name}</td>
                        <td>${project.manager.name}</td>
                        <td>${new Date(project.startDate).toLocaleDateString()}</td>
                        <td>${project.description}</td>
                        <td>
                            <button class="editProjectBtn" data-id="${project.id}">Edit</button>
                            <button class="deleteProjectBtn" data-id="${project.id}">Delete</button>
                            <button class="addImageBtn" data-id="${project.id}">Add Image</button>
                            <button class="viewImagesBtn" data-id="${project.id}">View Images</button>
                        </td>
                    </tr>
                `).join('');
                $('#projectList tbody').html(projectList);
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
            description: $('#projectDescription').val(),
            manager: {
                name: $('#managerName').val(),
                email: $('#managerEmail').val()
            },
            startDate: $('#startDate').val(),
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
                alert(`Failed to ${currentProjectId ? 'update' : 'add'} project:  ${xhr.responseJSON.error}`);
            }
        });
    });

    // Event delegation for Edit and Delete buttons
    $('#projectList').on('click', '.editProjectBtn', function() {
        currentProjectId = $(this).data('id');
        console.log('Editing project with ID:', currentProjectId);
        $.ajax({
            url: `/projects/${currentProjectId}`,
            method: 'GET',
            success: function(project) {
                console.log('Project details:', project);
                try {
                    $('#projectName').val(project.name);
                    $('#projectDescription').val(project.description);
                    $('#managerName').val(project.manager.name); // Ensure manager name is set
                    $('#managerEmail').val(project.manager.email);
                    $('#startDate').val(new Date(project.startDate).toISOString().split('T')[0]);
                    
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
                } catch (error) {
                    console.error('Error populating form:', error);
                    alert('Error populating form. Check the console for more details.');
                }
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
        $.ajax({
            url: '/unsplash',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query: query }),
            success: function(images) {
                const imageResults = images.map(image => `
                    <img src="${image.url}" data-id="${image.id}" data-description="${image.description}" class="image-item">
                `).join('');
                $('#imageResults').html(imageResults);
            },
            error: function(xhr, status, error) {
                console.error('Failed to search images:', error);
            }
        });
    });

    $('#imageResults').on('click', 'img', function() {
        console.log('Image clicked:', $(this).attr('src'));

        $('#imageResults img').removeClass('selected');
        $(this).addClass('selected');

        console.log('Selected class added:', $(this).hasClass('selected'));

        selectedImage = {
            id: $(this).data('id'),
            url: $(this).attr('src'),
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
            id: selectedImage.id,
            url: selectedImage.url,
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
                        <img src="${image.url}" alt="${image.description}">
                        <p>${image.description}</p>
                        <button class="deleteImageBtn" data-id="${image.id}">Delete</button>
                    </div>
                `).join('');
                $('#imageList').html(imageList);
            },
            error: function(xhr, status, error) {
                console.error('Failed to load project images:', error);
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
    $('th[data-sort]').click(function() {
        const sortField = $(this).data('sort');
        const order = $(this).hasClass('sort-asc') ? 'desc' : 'asc';

        loadProjectsSorted(sortField, order);
    });

    function loadProjectsSorted(sortField, order) {
        $.ajax({
            url: `/projects?sort=${sortField}&order=${order}`,
            method: 'GET',
            success: function(projects) {
                const projectList = projects.map(project => `
                    <tr>
                        <td>${project.id}</td>
                        <td>${project.name}</td>
                        <td>${project.manager.name}</td>
                        <td>${new Date(project.startDate).toLocaleDateString()}</td>
                        <td>${project.description}</td>
                        <td>
                            <button class="editProjectBtn" data-id="${project.id}">Edit</button>
                            <button class="deleteProjectBtn" data-id="${project.id}">Delete</button>
                            <button class="addImageBtn" data-id="${project.id}">Add Image</button>
                            <button class="viewImagesBtn" data-id="${project.id}">View Images</button>
                        </td>
                    </tr>
                `).join('');
                $('#projectList tbody').html(projectList);

                // Update sort icons
                $('th[data-sort]').removeClass('sort-asc sort-desc');
                $(`th[data-sort="${sortField}"]`).addClass(`sort-${order}`);
            },
            error: function(xhr, status, error) {
                console.error('Failed to load projects:', error);
            }
        });
    }

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
