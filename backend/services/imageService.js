export async function generateImage(prompt){

    return `https://ap-synapse-backend.onrender.com/image?prompt=${encodeURIComponent(prompt)}`;

}