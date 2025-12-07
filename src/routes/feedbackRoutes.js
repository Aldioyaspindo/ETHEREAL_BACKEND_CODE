import feedbackController from "../controllers/feedbackController.js";
import express from "express";

const feedbackRoute = express.Router();

feedbackRoute.get('/', feedbackController.getAllFeedback);
feedbackRoute.get('/:id', feedbackController.getFeedbackById);
feedbackRoute.post('/', feedbackController.createFeedback);
feedbackRoute.put('/:id', feedbackController.updateFeedback);
feedbackRoute.delete('/:id',  feedbackController.deleteFeedback);



export default feedbackRoute;