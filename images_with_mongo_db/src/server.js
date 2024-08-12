import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Member, Project } from './models.js'; 
import { fileURLToPath } from 'url';
import axios from 'axios';
import path from 'path'; 


const app = express();
const PORT = 3001;
const UNSPLASH_ACCESS_KEY = '18OerCUXhFCbPipqd27WL84AXgm3AQJojY2zoFM0TSM';

// Helper function to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/project_management');



// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.post('/members', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email ) {
            return res.status(400).json({ error: 'Name, email, and role are required.' });
        }
        const newMember = new Member({ name, email, role });
        await newMember.save();
        res.status(201).json({ id: newMember._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Create a new project
app.post('/projects', async (req, res) => {
    try {
        const { name, summary, manager, team, start_date } = req.body;
        const newProject = new Project({
            name,
            summary,
            manager,
            team,
            start_date,
            images: []
        });
        await newProject.save();
        res.status(201).json({ id: newProject._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find().populate('team').exec();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single project's details
app.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('team').exec();
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update a project
app.put('/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedProject = await Project.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a project
app.delete('/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProject = await Project.findByIdAndDelete(id);
        if (!deletedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add an image to a project
app.post('/projects/:id/images', async (req, res) => {
    const { id } = req.params;
    const { thumb_url, description } = req.body;

    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const newImage = { id: uuidv4(), path: thumb_url, description };
        project.images.push(newImage);
        await project.save();
        res.status(200).json({ message: 'Image added successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Delete an image from a project
app.delete('/projects/:projectId/images/:imageId', async (req, res) => {
    const { projectId, imageId } = req.params;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        project.images = project.images.filter(img => img.id !== imageId);
        await project.save();
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Search Unsplash images
app.post('/unsplash', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const response = await axios.get('https://api.unsplash.com/search/photos', {
            params: { query },
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });

        const images = response.data.results.map(image => ({
            id: image.id,
            thumb_url: image.urls.thumb,
            name: image.alt_description || 'Unnamed',
            description: image.description || 'No description available'
        }));

        res.status(200).json(images);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, 'localhost', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});