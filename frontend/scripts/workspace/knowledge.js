export const knowledge = [

{
title:"AP Synapse Architecture",
category:"AI",
favorite:true,
content:"Core architecture, router, memory engine and workspace."
},

{
title:"ScienceVerse",
category:"Education",
favorite:true,
content:"Educational platform built by Anuprit Patil."
},

{
title:"Board Mastery",
category:"Education",
favorite:false,
content:"Complete CBSE learning platform."
}

];

export function searchKnowledge(query){

return knowledge.filter(item=>

item.title.toLowerCase().includes(query.toLowerCase()) ||

item.content.toLowerCase().includes(query.toLowerCase()) ||

item.category.toLowerCase().includes(query.toLowerCase())

);

}