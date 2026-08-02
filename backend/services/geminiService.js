import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function createStream(messages){

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    });

    const prompt = messages
        .map(m => `${m.role}: ${m.content}`)
        .join("\n\n");

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    async function* stream(){

        yield{
            choices:[
                {
                    delta:{
                        content:text
                    }
                }
            ]
        };

    }

    return stream();

}