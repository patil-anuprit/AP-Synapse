export async function generateImage(prompt){

    return `http://localhost:5000/image?prompt=${encodeURIComponent(prompt)}`;

}