// import { NextResponse } from "next/server"
// import { openai } from "@ai-sdk/openai"
// import { generateText } from "ai"

// export async function POST(req: Request) {
//   try {
//     const { userName, input, messages } = await req.json()

//     if (!userName || !input) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       )
//     }
//     console.log("ENV KEY", process.env.OPENAI_API_KEY)

//     const { text } = await generateText({
//       model: openai.chat("gpt-3.5-turbo"),
//       prompt: `You are a helpful and motivational AI assistant for a student named ${userName}. 
//       Your goal is to help them with their mood, motivation, and academic stress. 
//       Be empathetic, positive, and provide practical advice. 
//       Previous conversation: ${JSON.stringify(messages?.slice(-5) ?? [])}. 
//       User's message: ${input}`,
//       system:
//         "You are a supportive AI mood assistant for students. Keep responses concise (under 150 words), empathetic, and motivational. Focus on stress management, motivation, and positive mindset.",
//     })

//     return NextResponse.json({ text })
//   } catch (err: any) {
//     console.error("AI generation error:", err)
//     return NextResponse.json(
//       { error: "Failed to generate response" },
//       { status: 500 }
//     )
//   }
// }
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { userName, input, messages } = await req.json();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Ensure the history starts with a user message
    const filteredMessages = messages.filter(
      (msg: any, index: number) => msg.role === "user" || index !== 0
    );

    const chat = model.startChat({
      history: filteredMessages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const result = await chat.sendMessage(
      `You are a helpful and motivational AI assistant for a student named ${userName}.
       Your goal is to help them with their mood, motivation, and academic stress.
       Be empathetic, concise (under 150 words), and provide practical advice.
       The user says: ${input}`
    );

    const response = result.response.text();
    return NextResponse.json({ text: response });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
