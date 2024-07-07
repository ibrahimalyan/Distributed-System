import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Helper function to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const PROJECTS_FILE = path.join(__dirname, '..', 'projects.json');

const UNSPLASH_ACCESS_KEY = '18OerCUXhFCbPipqd27WL84AXgm3AQJojY2zoFM0TSM'; // Replace with your Unsplash Access Key


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper function to read projects from the JSON file
const readProjects = () => {
    if (!fs.existsSync(PROJECTS_FILE)) {
        return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE);
    return JSON.parse(data);
};

// Helper function to write projects to the JSON file
const writeProjects = (projects) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// Helper function to search images on Unsplash
const searchUnsplashImages = async (query) => {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: { query },
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });

    return response.data.results.map(image => ({
        id: image.id,
        url: image.urls.regular,
        description: image.description || image.alt_description
    }));
};

// Project schema for yup validation
const projectSchema = yup.object().shape({
    name: yup.string().required(),
    description: yup.string().min(20).max(80).required(),
    manager: yup.object().shape({
        name: yup.string().required(),
        email: yup.string().email().required()
    }).required(),
    team: yup.array().of(yup.object().shape({
        name: yup.string().required(),
        email: yup.string().email().required(),
        role: yup.string().required()
    })).required(),
    startDate: yup.date().required(),
    goals: yup.array().of(yup.object().shape({
        description: yup.string().required(),
        date: yup.date().required()
    }))
});

// Route to get the list of projects
app.get('/projects', (req, res) => {
    const projects = readProjects();
    res.json(projects);
});

// Route to get a single project's details
app.get('/projects/:id', (req, res) => {
    const { id } = req.params;
    const projects = readProjects();
    const project = projects.find(proj => proj.id === id);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
});

// Route to create a new project
app.post('/projects', async (req, res) => {
    try {
        await projectSchema.validate(req.body);
        const projects = readProjects();
        const project = {
            id: uuidv4().toUpperCase(),
            name: req.body.name,
            description: req.body.description,
            manager: req.body.manager,
            team: req.body.team,
            startDate: req.body.startDate,
            goals: req.body.goals || [],
            images: []
        };

        projects.push(project);
        writeProjects(projects);

        res.status(201).json({ id: project.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to update a project
app.put('/projects/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await projectSchema.validate(req.body);

        const projects = readProjects();
        const projectIndex = projects.findIndex(project => project.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projects[projectIndex];

        project.name = req.body.name;
        project.description = req.body.description;
        project.startDate = req.body.startDate;
        project.manager = req.body.manager;
        project.team = req.body.team;
        project.goals = req.body.goals || [];

        projects[projectIndex] = project;
        writeProjects(projects);

        res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to add images to a project
app.post('/projects/:id/images', (req, res) => {
    const { id } = req.params;
    const { id: imageId, url, description } = req.body;

    const projects = readProjects();
    const project = projects.find(proj => proj.id === id);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const newImage = {
        id: imageId,
        url,
        description
    };

    project.images.push(newImage);
    writeProjects(projects);

    res.status(200).json({ message: 'Image added successfully' });
});


// Route to delete an image from a project
app.delete('/projects/:projectId/images/:imageId', (req, res) => {
    const { projectId, imageId } = req.params;
    const projects = readProjects();
    const project = projects.find(proj => proj.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const imageIndex = project.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
        return res.status(404).json({ error: 'Image not found' });
    }

    project.images.splice(imageIndex, 1);
    writeProjects(projects);

    res.status(200).json({ message: 'Image deleted successfully' });
});

// Route to delete a project
app.delete('/projects/:id', (req, res) => {
    const { id } = req.params;
    let projects = readProjects();
    const projectIndex = projects.findIndex(project => project.id === id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    projects = projects.filter(project => project.id !== id);
    writeProjects(projects);

    res.status(200).json({ message: 'Project deleted successfully' });
});

app.post('/unsplash', async (req, res) => {
    const { query } = req.body;

    try {
        const images = await searchUnsplashImages(query);
        res.status(200).json(images);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.listen(PORT, 'localhost', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
