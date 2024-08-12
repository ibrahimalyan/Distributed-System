import mongoose from 'mongoose';

const { Schema } = mongoose;

// Team member schema
const teamMemberSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, 
    
});

// Project schema
const projectSchema = new Schema({
    name: { type: String, required: true },
    summary: { type: String, required: true, minlength: 20, maxlength: 80 },
    manager: {
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    team: [teamMemberSchema],
    start_date: { type: Date, required: true },
    images: [{
        id: { type: String, required: true },
        path: { type: String, required: true },
        description: { type: String, required: true }
    }]
});

// Models
const Member = mongoose.model('Member', teamMemberSchema);
const Project = mongoose.model('Project', projectSchema);

export { Member, Project };