import PptxGenJS from 'pptxgenjs';

const C={
  bg:'151719',panel:'242628',panel2:'303237',
  gold:'C4A36A',white:'F5F0E8',
  muted:'B7B4AE',line:'51483A'
};

function safe(v,max=600){
  const s=String(v??'').replace(/\u0000/g,'').trim();
  if(s.length>max)throw new Error('PRESENTATION_TEXT_TOO_LONG');
  return s;
}

function list(v,max){
  if(!Array.isArray(v)||v.length>max)
    throw new Error('INVALID_PRESENTATION_ITEMS');
  return v;
}

function parts(v,max=400){
  const words=safe(v,6000).split(/\s+/).filter(Boolean);
  const result=[];
  let current='';

  for(const word of words){
    if(current && current.length+word.length+1>max){
      result.push(current);
      current='';
    }
    current+=(current?' ':'')+word;
  }
  if(current)result.push(current);
  return result.length?result:[''];
}

function normalize(plan){
  if(plan.slides!==undefined)
    return list(plan.slides,20);

  // Compatible with AP Synapse's existing sections schema.
  return list(plan.sections||[],20).flatMap(section=>{
    const blocks=parts(section.body||'');
    return blocks.map((body,i)=>({
      type:'content',
      title:safe(section.heading||'Section',110)+
        (i?' (continued)':''),
      body,
      bullets:i?[]:(section.bullets||[])
    }));
  });
}

export async function renderSlidesV3(plan){
  if(!plan||typeof plan!=='object')
    throw new Error('INVALID_PRESENTATION_PLAN');

  const pages=normalize(plan);
  if(!pages.length||pages.length>20)
    throw new Error('INVALID_PRESENTATION_LENGTH');

  const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';
  pptx.author='AP Synapse';
  pptx.title=safe(plan.title||'Untitled',160);
  pptx.lang='en-US';

  const S=pptx.ShapeType;

  const write=(slide,value,x,y,w,h,size=18,color=C.white,bold=false,align='left')=>
    slide.addText(safe(value,600),{
      x,y,w,h,fontFace:'Aptos',
      fontSize:size,color,bold,align,
      fit:'shrink',breakLine:false,
      valign:'mid',margin:0
    });

  const card=(slide,x,y,w,h,fill=C.panel)=>
    slide.addShape(S.roundRect,{
      x,y,w,h,
      rectRadius:.12,
      line:{color:fill,width:.7},
      fill:{color:fill}
    });

  const bullets=(slide,items,x,y,w,step=.72,size=15)=>{
    list(items,7).forEach((value,i)=>{
      const yy=y+i*step;
      slide.addShape(S.ellipse,{
        x,y:yy+.1,w:.10,h:.10,
        line:{color:C.gold},
        fill:{color:C.gold}
      });
      write(slide,safe(value,180),x+.26,yy,
        w-.3,step-.06,size);
    });
  };

  let number=0;

  function base(label){
    const slide=pptx.addSlide();
    number++;
    slide.background={color:C.bg};

    slide.addShape(S.rect,{
      x:0,y:0,w:.09,h:7.5,
      line:{color:C.gold},
      fill:{color:C.gold}
    });

    write(slide,
      safe(plan.organization||'AP SYNAPSE',60).toUpperCase(),
      .7,.33,4,.3,9,C.gold,true
    );

    write(slide,label.toUpperCase(),
      9,.33,3.5,.3,9,C.muted,false,'right'
    );

    slide.addShape(S.line,{
      x:.7,y:6.95,w:11.9,h:0,
      line:{color:C.line,width:.8}
    });

    write(slide,String(number).padStart(2,'0'),
      11.9,7.08,.7,.16,8,C.muted,false,'right'
    );

    return slide;
  }

  function heading(slide,title){
    write(slide,safe(title,135),
      .78,1.16,11.85,.95,29,C.white,true);

    slide.addShape(S.line,{
      x:.79,y:2.18,w:1.25,h:0,
      line:{color:C.gold,width:3}
    });
  }

  let slide=base('TITLE');

  write(slide,pptx.title,.83,1.97,11.5,1.65,
    36,C.white,true);

  if(plan.subtitle)
    write(slide,safe(plan.subtitle,220),
      .88,3.85,10.9,.85,17,C.gold);

  write(slide,'INTELLIGENCE / PRESENTATION',
    .88,5.76,7,.28,11,C.muted);

  for(const [index,item] of pages.entries()){
    if(!item||typeof item!=='object')
      throw new Error('INVALID_SLIDE');

    const type=safe(item.type||'content',25).toLowerCase();

    slide=base(type);
    heading(slide,item.title||item.heading||`Section ${index+1}`);

    if(type==='content'){
      const body=safe(item.body||'',600);
      const points=list(item.bullets||[],6);

      if(body){
        card(slide,.8,2.55,points.length?7.3:11.72,3.4);

        write(slide,body,1.08,2.83,
          points.length?6.75:11.1,2.77,18);
      }

      if(points.length){
        if(body)card(slide,8.3,2.55,4.22,3.4,C.panel2);

        bullets(slide,points,
          body?8.52:1,2.8,
          body?3.7:11,
          points.length>4?.5:.69,15);
      }
    }

    else if(type==='overview'){
      const entries=list(item.items||[],6);
      if(entries.length<2)throw new Error('OVERVIEW_ITEMS_REQUIRED');

      entries.forEach((value,i)=>{
        const x=.8+(i%2)*5.98;
        const y=2.52+Math.floor(i/2)*1.35;

        card(slide,x,y,5.7,1.15,
          i%2?C.panel2:C.panel);

        write(slide,String(i+1).padStart(2,'0'),
          x+.22,y+.24,.5,.5,16,C.gold,true);

        write(slide,safe(value,180),
          x+.88,y+.18,4.48,.77,16);
      });
    }

    else if(type==='metrics'){
      const entries=list(item.metrics||[],4);
      if(!entries.length)throw new Error('METRICS_REQUIRED');

      const w=11.72/entries.length-.18;

      entries.forEach((m,i)=>{
        const x=.8+i*(w+.18);
        card(slide,x,2.72,w,2.86);

        write(slide,safe(m.value,45),
          x+.18,3.1,w-.36,.8,30,C.gold,true);

        write(slide,safe(m.label,75),
          x+.18,4.05,w-.36,.57,15,C.white,true);

        if(m.note)
          write(slide,safe(m.note,120),
            x+.18,4.68,w-.36,.54,11,C.muted);
      });
    }

    else if(type==='comparison'){
      for(const [i,part] of [item.left,item.right].entries()){
        if(!part||typeof part!=='object')
          throw new Error('COMPARISON_SIDES_REQUIRED');

        const x=.8+i*6.05;
        card(slide,x,2.48,5.7,3.78,
          i?C.panel2:C.panel);

        write(slide,safe(part.title||`Option ${i+1}`,75),
          x+.26,2.84,5.05,.5,21,C.gold,true);

        bullets(slide,list(part.bullets||[],4),
          x+.29,3.63,5.1,.57,14);
      }
    }

    else if(type==='timeline'||type==='process'){
      const steps=list(item.steps||[],5);
      if(steps.length<2)throw new Error('STEPS_REQUIRED');

      if(type==='process'){
        const gap=.38;
        const w=(11.68-(steps.length-1)*gap)/steps.length;

        steps.forEach((step,i)=>{
          const x=.8+i*(w+gap);

          card(slide,x,2.72,w,3.03,
            i%2?C.panel2:C.panel);

          write(slide,String(i+1).padStart(2,'0'),
            x+.17,3.0,w-.34,.43,21,C.gold,true);

          write(slide,safe(step.title||'',75),
            x+.17,3.72,w-.34,.63,17,C.white,true);

          write(slide,safe(step.detail||'',135),
            x+.17,4.55,w-.34,.85,13,C.muted);

          if(i<steps.length-1){
            slide.addShape(S.line,{
              x:x+w+.07,
              y:4.17,
              w:gap-.14,
              h:0,
              line:{
                color:C.gold,
                width:1.8,
                endArrowType:'triangle'
              }
            });
          }
        });
      }else{
        const first=1.55;
        const last=11.72;
        const lineY=4.04;
        const segment=(last-first)/(steps.length-1);
        const cardWidth=Math.min(2.3,segment-.16);

        slide.addShape(S.line,{
          x:first,y:lineY,w:last-first,h:0,
          line:{color:C.gold,width:2}
        });

        steps.forEach((step,i)=>{
          const cx=first+i*segment;
          const y=i%2===0?2.48:4.40;
          const x=cx-cardWidth/2;

          card(slide,x,y,cardWidth,1.10,
            i%2?C.panel2:C.panel);

          write(slide,safe(step.title||'',75),
            x+.13,y+.10,cardWidth-.26,.37,
            15,C.white,true,'center');

          write(slide,safe(step.detail||'',130),
            x+.13,y+.52,cardWidth-.26,.42,
            11.5,C.muted,false,'center');

          slide.addShape(S.ellipse,{
            x:cx-.115,y:lineY-.115,
            w:.23,h:.23,
            line:{color:C.gold,width:1},
            fill:{color:C.gold}
          });
        });
      }
    }

    else if(type==='chart'){
      const chart=item.chart||{};
      const kind=safe(chart.kind||'bar',20).toLowerCase();

      if(!['bar','line','doughnut'].includes(kind))
        throw new Error('INVALID_CHART_KIND');

      const labels=list(chart.labels||[],8)
        .map(value=>safe(value,55));
      const values=list(chart.values||[],8);

      if(labels.length<2||
         labels.length!==values.length||
         values.some(v=>typeof v!=='number'||!Number.isFinite(v)))
        throw new Error('INVALID_CHART_DATA');

      card(slide,.8,2.51,11.7,3.83);

      slide.addChart(
        pptx.ChartType[kind],
        [{
          name:safe(chart.name||'Series',65),
          labels,
          values
        }],
        {
          x:1.06,y:2.76,w:10.96,h:3.27,
          showTitle:false,
          showLegend:false,
          showValue:true,
          dataLabelColor:C.white,
          chartColors:[C.gold,'8D6E3E','C5BFB2'],
          showBorder:false,
          showShadow:false,
          catAxisLabelColor:C.white,
          valAxisLabelColor:C.white,
          catAxisLabelFontSize:11,
          valAxisLabelFontSize:10,
          showMarker:true,
          lineSize:3
        }
      );

      if(item.caption)
        write(slide,safe(item.caption,180),
          .92,6.39,11.3,.28,10,C.muted);
    }

    else if(type==='closing'){
      write(slide,safe(item.body||'Thank you',350),
        .87,2.75,11.55,1.7,30,C.gold,true);
    }

    else{
      throw new Error(`UNSUPPORTED_SLIDE_LAYOUT:${type}`);
    }
  }

  return Buffer.from(
    await pptx.write({outputType:'nodebuffer'})
  );
}
