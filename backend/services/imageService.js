export async function generateImage(prompt){

    return `https://api.ap-synapse.com/image?prompt=${encodeURIComponent(prompt)}`;

}
