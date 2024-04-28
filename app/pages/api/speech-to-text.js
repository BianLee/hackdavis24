import { SpeechClient } from "@google-cloud/speech";

export default async function handler(req, res) {
  console.log("Request body:", req.body); // Log the entire body to verify it's receiving data correctly

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!req.body || !req.body.audio) {
    return res.status(400).json({ error: "No audio data provided" });
  }

  try {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, "base64").toString(
        "ascii"
      )
    );
    const client = new SpeechClient({ credentials });

    const audioBase64 = req.body.audio;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "Invalid or missing audio data" });
    }

    const audioBytes = Buffer.from(audioBase64, "base64");
    if (!audioBytes || audioBytes.length === 0) {
      return res
        .status(400)
        .json({ error: "Failed to convert audio data to Buffer" });
    }

    const audio = { content: audioBytes };
    const config = {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    };
    const request = { audio: audio, config: config };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");
    res.status(200).json({ transcription });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    res
      .status(500)
      .json({ error: "Error processing your request", details: error.message });
  }
}