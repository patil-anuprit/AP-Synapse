import {existsSync} from 'node:fs';
import {cleanText} from './intent.mjs';

const text = (v,n=5000) => cleanText(v ?? '',n);
const sections = p => Array.isArray(p?.sections)
  ? p.sections.slice(0,30) : [];

const C = {
  dark:'#202126',
  gold:'#A17A3C',
  muted:'#606771',
  pale:'#F4F0E8'
};

export async function renderPDF(plan) {
  const PDFKit = (await import('pdfkit')).default;

  return new Promise((resolve,reject)=>{
    const pdf = new PDFKit({
      size:'A4',
      margin:58,
      bufferPages:true,
      info:{
        Title:text(plan.title,150)||'Document',
        Author:'AP Synapse'
      }
    });

    const buffers=[];
    pdf.on('data',b=>buffers.push(b));
    pdf.on('end',()=>resolve(Buffer.concat(buffers)));
    pdf.on('error',reject);

    const regularPath=[
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'
    ].find(existsSync);

    const boldPath=[
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'
    ].find(existsSync);

    if(regularPath) pdf.registerFont('APRegular',regularPath);
    if(boldPath) pdf.registerFont('APBold',boldPath);

    const regular=regularPath?'APRegular':'Helvetica';
    const bold=boldPath?'APBold':'Helvetica-Bold';

    function pageHeader(){
      const width=pdf.page.width;
      pdf.rect(0,0,width,8).fill(C.gold);
      pdf.font(regular).fontSize(8).fillColor(C.muted)
        .text(
          text(plan.organization||'AP SYNAPSE',70).toUpperCase(),
          58,27,{width:width-116,lineBreak:false}
        );
      pdf.moveTo(58,48).lineTo(width-58,48)
        .lineWidth(.5).strokeColor('#DDD5C8').stroke();
    }

    pdf.on('pageAdded',pageHeader);
    pageHeader();
    pdf.moveDown(1.6);

    pdf.font(bold).fontSize(26).fillColor(C.dark)
      .text(text(plan.title,180)||'Untitled',{
        lineGap:5
      });

    if(plan.subtitle){
      pdf.moveDown(.35);
      pdf.font(regular).fontSize(11).fillColor(C.muted)
        .text(text(plan.subtitle,400));
    }

    pdf.moveDown(1.4);

    for(const section of sections(plan)){
      if(pdf.y>pdf.page.height-135) pdf.addPage();

      pdf.font(bold).fontSize(15).fillColor(C.gold)
        .text(text(section.heading,160)||'Section',{
          lineGap:4
        });

      pdf.moveDown(.35);

      if(section.body){
        pdf.font(regular).fontSize(10.5).fillColor(C.dark)
          .text(text(section.body,8000),{
            lineGap:4
          });
      }

      const bullets=Array.isArray(section.bullets)
        ? section.bullets.slice(0,20) : [];

      for(const item of bullets){
        if(pdf.y>pdf.page.height-100)pdf.addPage();

        pdf.font(regular).fontSize(10).fillColor(C.dark)
          .text('•  '+text(item,550),{
            indent:12,
            lineGap:3
          });
      }

      const table=section.table;

      if(Array.isArray(table?.headers) &&
         Array.isArray(table?.rows) &&
         table.headers.length>0){

        const headers=table.headers.slice(0,6)
          .map(v=>text(v,120));

        const width=pdf.page.width-116;
        const columnWidth=width/headers.length;

        function drawTableRow(values,isHeader,index){
          pdf.font(isHeader?bold:regular).fontSize(8.5);

          const cells=values.map(v=>text(v,350));

          const height=Math.min(76,Math.max(
            28,
            ...cells.map(value=>
              pdf.heightOfString(value,{
                width:columnWidth-18,
                lineGap:2
              })+14
            )
          ));

          if(pdf.y+height>pdf.page.height-65){
            pdf.addPage();

            if(!isHeader){
              drawTableRow(headers,true,0);
            }
          }

          const y=pdf.y;

          const background=isHeader
            ? C.dark
            : index%2===0?'#F7F4ED':'#FFFFFF';

          pdf.rect(58,y,width,height)
            .lineWidth(.35)
            .fillAndStroke(background,'#DDD6C9');

          cells.forEach((value,i)=>{
            pdf.font(isHeader?bold:regular)
              .fontSize(8.5)
              .fillColor(isHeader?'#FFFFFF':C.dark)
              .text(
                value,
                58+i*columnWidth+9,
                y+7,
                {
                  width:columnWidth-18,
                  height:height-12,
                  ellipsis:true,
                  lineGap:2
                }
              );
          });

          // Reset the cursor after manually positioned table cells.
          pdf.x=58;
          pdf.y=y+height;
        }

        pdf.moveDown(.45);
        drawTableRow(headers,true,0);

        table.rows.slice(0,70).forEach((row,index)=>{
          const values=headers.map((_,i)=>
            Array.isArray(row)?row[i]??'':''
          );

          drawTableRow(values,false,index);
        });
      }

      pdf.moveDown(1.25);
    }

    if(!sections(plan).length && plan.body){
      pdf.font(regular).fontSize(10.5)
        .fillColor(C.dark).text(text(plan.body,15000));
    }

    const pages=pdf.bufferedPageRange();

    for(let i=0;i<pages.count;i++){
      pdf.switchToPage(pages.start+i);

      // Footer content must not trigger normal page overflow.
      const savedBottom=pdf.page.margins.bottom;
      pdf.page.margins.bottom=0;

      pdf.font(regular).fontSize(8).fillColor(C.muted)
        .text(
          `Page ${i+1} of ${pages.count}`,
          58,pdf.page.height-43,{
            width:pdf.page.width-116,
            align:'right',
            lineBreak:false
          }
        );

      pdf.page.margins.bottom=savedBottom;
    }

    pdf.end();
  });
}

// Convert clearly structured key/value bullets into real editable table cells.
// Other bullet lists remain untouched; a structured section.table takes precedence.
function tableForSection(section){
  const explicit=section?.table;
  if(Array.isArray(explicit?.headers) && explicit.headers.length &&
     Array.isArray(explicit?.rows))
    return {table:explicit,fromBullets:false};

  const bullets=Array.isArray(section?.bullets)?section.bullets:[];
  if(bullets.length<2 || bullets.length>20)return null;

  const parsed=bullets.map(item=>{
    if(typeof item!=='string')return null;
    const parts=item.split(/\s+\|\s+/);
    if(parts.length<2 || parts.length>6)return null;
    const pairs=parts.map(part=>
      /^\s*([^:|]{2,80}):\s*(.{1,350})\s*$/.exec(part)
    );
    if(pairs.some(pair=>!pair))return null;
    return pairs.map(pair=>[pair[1].trim(),pair[2].trim()]);
  });
  if(parsed.some(row=>!row))return null;

  const headers=parsed[0].map(pair=>pair[0]);
  if(parsed.some(row=>row.length!==headers.length ||
    row.some((pair,i)=>pair[0].toLowerCase()!==headers[i].toLowerCase())))
    return null;

  return {
    fromBullets:true,
    table:{headers,rows:parsed.map(row=>row.map(pair=>pair[1]))}
  };
}

export async function renderDOCX(plan){
  const d=await import('docx');
  const {
    Document,Packer,Paragraph,TextRun,HeadingLevel,
    Header,Footer,PageNumber,AlignmentType,
    Table,TableRow,TableCell,WidthType
  }=d;

  const children=[
    new Paragraph({
      children:[new TextRun({
        text:text(plan.title,180)||'Untitled',
        font:'Aptos Display',
        size:42,
        bold:true,
        color:'202126'
      })],
      heading:HeadingLevel.TITLE,
      spacing:{after:180}
    })
  ];

  if(plan.subtitle){
    children.push(new Paragraph({
      children:[new TextRun({
        text:text(plan.subtitle,350),
        font:'Aptos',
        size:23,
        color:'606771'
      })],
      spacing:{after:300}
    }));
  }

  for(const section of sections(plan)){
    children.push(new Paragraph({
      children:[new TextRun({
        text:text(section.heading,160)||'Section',
        font:'Aptos Display',
        size:30,
        bold:true,
        color:'A17A3C'
      })],
      heading:HeadingLevel.HEADING_1,
      spacing:{before:260,after:140},
      keepNext:true
    }));

    if(section.body){
      children.push(new Paragraph({
        children:[new TextRun({
          text:text(section.body,8000),
          font:'Aptos',
          size:21,
          color:'202126'
        })],
        spacing:{after:150,line:320}
      }));
    }

    const normalizedTable=tableForSection(section);

    for(const item of (
      normalizedTable?.fromBullets ? [] :
      (Array.isArray(section.bullets)
        ? section.bullets.slice(0,20) : [])
    )){
      children.push(new Paragraph({
        children:[new TextRun({
          text:text(item,550),
          font:'Aptos',
          size:21,
          color:'202126'
        })],
        bullet:{level:0},
        spacing:{after:80}
      }));
    }

    const t=normalizedTable?.table;

    if(Array.isArray(t?.headers) &&
       Array.isArray(t?.rows) &&
       t.headers.length>0){

      const headers=t.headers.slice(0,6);
      const makeRow=(values,isHeader)=>new TableRow({
        children:values.map(value=>new TableCell({
          shading:{
            fill:isHeader?'28292C':'F7F5F0'
          },
          children:[new Paragraph({
            children:[new TextRun({
              text:text(value,400),
              bold:isHeader,
              color:isHeader?'FFFFFF':'222222'
            })]
          })]
        }))
      });

      children.push(new Table({
        width:{size:100,type:WidthType.PERCENTAGE},
        rows:[
          makeRow(headers,true),
          ...t.rows.slice(0,70).map(row=>
            makeRow(headers.map((_,i)=>
              Array.isArray(row)?row[i]??'':''
            ),false)
          )
        ]
      }));
    }
  }

  if(!sections(plan).length && plan.body){
    children.push(new Paragraph({
      text:text(plan.body,15000)
    }));
  }

  const header=new Header({
    children:[new Paragraph({
      text:text(plan.organization||'AP SYNAPSE',80),
      alignment:AlignmentType.RIGHT
    })]
  });

  const footer=new Footer({
    children:[new Paragraph({
      alignment:AlignmentType.RIGHT,
      children:[
        new TextRun('Page '),
        new TextRun({children:[PageNumber.CURRENT]})
      ]
    })]
  });

  const doc=new Document({
    sections:[{
      properties:{
        page:{
          margin:{
            top:1000,
            bottom:950,
            left:1000,
            right:1000
          }
        }
      },
      headers:{default:header},
      footers:{default:footer},
      children
    }]
  });

  return Packer.toBuffer(doc);
}

function splitWords(value,max=470){
  const words=text(value,9000).split(/\s+/).filter(Boolean);
  const out=[];
  let current='';

  for(const word of words){
    if(current && current.length+word.length+1>max){
      out.push(current);
      current='';
    }
    current+=(current?' ':'')+word;
  }

  if(current)out.push(current);
  return out;
}

export async function renderSlides(plan){
  const PptxGenJS=(await import('pptxgenjs')).default;
  const pptx=new PptxGenJS();

  pptx.layout='LAYOUT_WIDE';
  pptx.author='AP Synapse';
  pptx.title=text(plan.title,150);
  pptx.lang='en-US';

  const shape=pptx.ShapeType;
  let number=0;

  function addBase(label){
    const slide=pptx.addSlide();
    number++;
    slide.background={color:'17191C'};

    slide.addShape(shape.rect,{
      x:0,y:0,w:.14,h:7.5,
      line:{color:'B18D4E'},
      fill:{color:'B18D4E'}
    });

    slide.addText(
      text(plan.organization||'AP SYNAPSE',60).toUpperCase(),
      {
        x:.75,y:7.03,w:5,h:.2,
        fontSize:8,color:'BAA47F'
      }
    );

    slide.addText(String(number).padStart(2,'0'),{
      x:11.8,y:7.03,w:.65,h:.2,
      fontSize:8,color:'999999',align:'right'
    });

    slide.addShape(shape.line,{
      x:.75,y:6.9,w:11.8,h:0,
      line:{color:'927446',width:.8}
    });

    slide.addText(label.toUpperCase(),{
      x:.78,y:.45,w:10,h:.3,
      fontSize:10,bold:true,color:'CAA869'
    });

    return slide;
  }

  const cover=addBase('Presentation');

  cover.addText(text(plan.title,180)||'Untitled',{
    x:.85,y:2.05,w:11.55,h:1.55,
    fontFace:'Aptos Display',
    fontSize:36,bold:true,
    color:'F6F1E8',
    fit:'shrink'
  });

  if(plan.subtitle){
    cover.addText(text(plan.subtitle,350),{
      x:.9,y:3.9,w:10.8,h:.85,
      fontSize:17,color:'CBB78F',
      fit:'shrink'
    });
  }

  for(const section of sections(plan)){
    const parts=splitWords(section.body||'');
    const bullets=Array.isArray(section.bullets)
      ? section.bullets.slice(0,20)
          .map(x=>text(x,300)) : [];

    const total=Math.max(
      1,parts.length,Math.ceil(bullets.length/4)
    );

    for(let index=0;index<total;index++){
      const slide=addBase(
        index?'Section continued':'Section'
      );

      slide.addText(
        text(section.heading,130)||'Section',
        {
          x:.8,y:.95,w:11.7,h:.85,
          fontSize:29,bold:true,
          color:'F8F3E8',fit:'shrink'
        }
      );

      slide.addShape(shape.line,{
        x:.8,y:1.9,w:1.1,h:0,
        line:{color:'C7A15E',width:3}
      });

      const body=parts[index]||'';
      const points=bullets.slice(index*4,(index+1)*4);

      if(body){
        slide.addText(body,{
          x:.9,y:2.35,
          w:points.length?7.1:11.3,
          h:3.9,
          fontSize:18,
          color:'E6E3DD',
          valign:'top',
          fit:'shrink'
        });
      }

      if(points.length){
        const x=body?8.4:.95;

        slide.addText('KEY POINTS',{
          x,y:2.3,w:3.9,h:.35,
          fontSize:11,bold:true,
          color:'C9A868'
        });

        points.forEach((point,j)=>{
          const y=2.88+j*.9;

          slide.addShape(shape.ellipse,{
            x,y:y+.1,w:.1,h:.1,
            line:{color:'C6A261'},
            fill:{color:'C6A261'}
          });

          slide.addText(point,{
            x:x+.25,y,
            w:body?3.55:10.6,
            h:.65,
            fontSize:15,
            color:'F1EEE8',
            fit:'shrink'
          });
        });
      }
    }
  }

  return Buffer.from(
    await pptx.write({outputType:'nodebuffer'})
  );
}
