import {cleanText} from './intent.mjs';
const title=s=>cleanText(s,150)||'Untitled';
function sectionsOf(plan){return Array.isArray(plan?.sections)?plan.sections.slice(0,18).map(s=>({heading:title(s.heading),body:cleanText(s.body,1800),bullets:Array.isArray(s.bullets)?s.bullets.slice(0,10).map(b=>cleanText(b,240)):[]})):[];}
export async function renderPDF(plan){
  const PDFKit=(await import('pdfkit')).default;
  return new Promise((resolve,reject)=>{
    const pdf=new PDFKit({size:'A4',margin:55,info:{Title:title(plan.title),Author:'AP Synapse'}});
    const chunks=[];pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);
    pdf.fillColor('#231F1B').font('Helvetica-Bold').fontSize(23).text(title(plan.title),{lineGap:5});
    if(plan.subtitle)pdf.font('Helvetica').fillColor('#666666').fontSize(11).text(cleanText(plan.subtitle,240));
    pdf.moveDown(1.2);
    for(const section of sectionsOf(plan)){
      pdf.fillColor('#94702E').font('Helvetica-Bold').fontSize(15).text(section.heading,{continued:false});
      if(section.body)pdf.fillColor('#262626').font('Helvetica').fontSize(10.5).text(section.body,{lineGap:4});
      for(const bullet of section.bullets)pdf.fillColor('#262626').font('Helvetica').fontSize(10).text('• '+bullet,{indent:12,lineGap:3});
      pdf.moveDown(0.8);
    }
    if(!sectionsOf(plan).length)pdf.font('Helvetica').fontSize(11).text(cleanText(plan.body,12000)||'');
    pdf.end();
  });
}
export async function renderDOCX(plan){
  const d=await import('docx');const {Document,Packer,Paragraph,TextRun,HeadingLevel}=d;
  const paragraphs=[new Paragraph({text:title(plan.title),heading:HeadingLevel.TITLE})];
  if(plan.subtitle) paragraphs.push(new Paragraph({text:cleanText(plan.subtitle,250)}));
  for(const s of sectionsOf(plan)){
    paragraphs.push(new Paragraph({text:s.heading,heading:HeadingLevel.HEADING_1}));
    if(s.body)paragraphs.push(new Paragraph({children:[new TextRun(s.body)]}));
    for(const b of s.bullets)paragraphs.push(new Paragraph({text:b,bullet:{level:0}}));
  }
  if(!sectionsOf(plan).length)paragraphs.push(new Paragraph({text:cleanText(plan.body,15000)}));
  const doc=new Document({sections:[{children:paragraphs}]});return Packer.toBuffer(doc);
}
export async function renderSlides(plan){
  const PptxGenJS=(await import('pptxgenjs')).default;
  const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='AP Synapse';pptx.subject='AI-generated presentation';pptx.title=title(plan.title);pptx.lang='en-US';
  const addBase=(slide,i)=>{slide.background={color:'151617'};slide.addShape(pptx.ShapeType.line,{x:.64,y:6.95,w:11.95,h:0,line:{color:'B39250',width:.8}});slide.addText('AP SYNAPSE',{x:.7,y:7.04,w:2.1,h:.19,fontFace:'Aptos',fontSize:8,color:'AD945C'});slide.addText(String(i).padStart(2,'0'),{x:11.7,y:7.04,w:.9,h:.19,fontSize:8,color:'999999',align:'right'});};
  let slide=pptx.addSlide();addBase(slide,1);
  slide.addText(title(plan.title),{x:.8,y:2.2,w:11.7,h:1.15,fontFace:'Aptos Display',fontSize:34,bold:true,color:'F2EEE4',breakLine:false,fit:'shrink'});
  if(plan.subtitle)slide.addText(cleanText(plan.subtitle,250),{x:.84,y:3.48,w:10.7,h:.86,fontSize:16,color:'C2AC80',fit:'shrink'});
  const sections=sectionsOf(plan).slice(0,16);
  let n=2;
  for(const item of sections){
    slide=pptx.addSlide();addBase(slide,n++);
    slide.addText(item.heading,{x:.72,y:.58,w:11.8,h:.8,fontSize:27,bold:true,color:'F4EDE1',fit:'shrink'});
    slide.addShape(pptx.ShapeType.line,{x:.74,y:1.53,w:1.05,h:0,line:{color:'BA9854',width:3}});
    if(item.body)slide.addText(item.body,{x:.83,y:1.85,w:11.1,h:1.75,fontSize:17,color:'DDDDDD',valign:'top',breakLine:false,fit:'shrink'});
    const y=item.body?3.72:1.95;
    const bullets=item.bullets.slice(0,6);
    bullets.forEach((b,j)=>{
      slide.addShape(pptx.ShapeType.ellipse,{x:.84,y:y+j*.49+.12,w:.09,h:.09,line:{color:'BE9D5D'},fill:{color:'BE9D5D'}});
      slide.addText(b,{x:1.08,y:y+j*.49,w:11.15,h:.4,fontSize:15.5,color:'F4F1EA',fit:'shrink',breakLine:false});
    });
  }
  return Buffer.from(await pptx.write({outputType:'nodebuffer'}));
}
