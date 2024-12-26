require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const { marked } = require("marked");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const { User } = require("./model/user/user.mongo");
const { Conversation } = require("./model/conversation/conversation.mongo");

const app = express();
app.use(cors());
app.use(express.json());

const systemInstruction =
  "Instruction for AI Helper Bot:You are an AI teaching assistant specialized in Data Structures and Algorithms (DSA). Your primary role is to educate users, guide problem-solving, and explain DSA concepts step-by-step. Follow these rules strictly:Scope of Assistance:Only respond to queries related to DSA topics such as algorithms, data structures, complexity analysis, and DSA-specific problem-solving techniques.Decline to answer unrelated questions politely by redirecting the user to appropriate resources.Behavior:Prioritize learning: Provide hints, explanations, and guidance instead of direct answers, unless explicitly requested.Use clear and concise language, including examples, pseudocode, or analogies where helpful.Avoid performing repetitive mechanical tasks or solving academic assignments/exam questions outright.Engagement:Start by identifying the user's query and asking clarifying questions if the problem is ambiguous.Guide the user step-by-step and confirm their understanding at each stage.Encourage users by highlighting their progress and providing constructive feedback.Limitations:Avoid general programming assistance not related to DSA.Do not engage in debates, opinions, or discussions unrelated to the DSA context.Tone:Be encouraging, patient, and focused on helping users develop problem-solving skills in DSA.Remember, your goal is to teach, guide, and explain—never just to solve without helping the user understand.";

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in environment variables.");
  process.exit(1); // Exit the application if the API key is missing
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/query", async (req, res) => {
  const { query, context, db_data } = req.body;

  console.log("Received query:", query);
  console.log("Context:", context);
  console.log("DB Data:", db_data);

  if (!query || !db_data || !db_data.user_name || !db_data.problem_title) {
    return res.status(400).json({
      status: "failed",
      error:
        "Invalid request data. Ensure query, user_name, and problem_title are provided.",
    });
  }

  const user_name_from_db = db_data.user_name;
  const problem_title_from_db = db_data.problem_title;

  try {
    let user = await User.findOne({ username: user_name_from_db });
    if (!user) {
      user = await new User({
        username: user_name_from_db,
        conversations: [],
      }).save();
    }

    let conversation = await Conversation.findOne({
      owner: user._id,
      title: problem_title_from_db,
    });

    if (!conversation) {
      conversation = await new Conversation({
        title: problem_title_from_db,
        owner: user._id,
        messages: [],
      }).save();
      user.conversations.push(conversation._id);
      await user.save();
    }

    const history = conversation.messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    const chat = model.startChat({ history });
    const prompt = `${query}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    const result = await chat.sendMessage(prompt);
    const aiResponse = result.response.text();

    const marked_response = marked(aiResponse);

    conversation.messages.push(
      { role: "user", parts: query },
      { role: "model", parts: marked_response }
    );
    await conversation.save();

    res.status(200).json({
      status: "success",
      response: marked_response,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Error querying Gemini AI or database operations:", error);
    res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
});

// New /history endpoint
app.get("/history", async (req, res) => {
  const { user_name, problem_title } = req.query;

  if (!user_name || !problem_title) {
    return res.status(400).json({
      status: "failed",
      error: "Missing user_name or problem_title in query parameters.",
    });
  }

  try {
    const user = await User.findOne({ username: user_name });
    if (!user) {
      return res.status(404).json({
        status: "failed",
        error: "User not found.",
      });
    }

    const conversation = await Conversation.findOne({
      owner: user._id,
      title: problem_title,
    });

    if (!conversation) {
      // Return an empty conversation if none exists for this problem
      return res.status(200).json({
        status: "success",
        conversation: [],
      });
    }

    res.status(200).json({
      status: "success",
      conversation: conversation.messages,
    });
  } catch (error) {
    console.error("Error retrieving conversation history:", error);
    res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
