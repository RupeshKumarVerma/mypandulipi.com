/* MyPandulipi storefront — progressively enhanced, no checkout or price storage. */
(() => {
  'use strict';
  const products = window.MP_CATALOGUE || [];
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => [...root.querySelectorAll(q)];
  const normal = value => String(value).toLowerCase().normalize('NFKC').replace(/[’']/g,'').replace(/\s+/g,' ').trim();
  const matches = (p, query) => normal(query).split(' ').filter(Boolean).every(word => normal(p.search).includes(word));
  const whatsapp = message => 'https://wa.me/918982659046?text=' + encodeURIComponent(message);
  let lastFocus;
  const menu = $('#mobile-menu'), toggle = $('.menu-toggle');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open',open);
  }
  toggle?.addEventListener('click',()=>setMenu(menu.hidden));
  $$('a',menu || document.createElement('div')).forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && menu && !menu.hidden){setMenu(false);toggle.focus();}
  });
  window.matchMedia('(min-width: 851px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
  function openDialog(dialog) {
    if(!dialog) return;
    lastFocus = document.activeElement;
    setMenu(false);
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  $$('dialog').forEach(dialog=>{
    $$('[data-close-dialog]',dialog).forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}
    });
    dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lastFocus?.focus();});
  });
  /* Search in either English or Hindi, from the same catalogue as Meera. */
  const searchDialog=$('#search-dialog'), globalSearch=$('#global-search'), resultBox=$('#search-results');
  function renderResults(query='') {
    if(!resultBox) return;
    const found = query.trim() ? products.filter(p=>matches(p,query)) : products.filter(p=>['sundarkand','shrimad-bhagavad-gita','hanuman-chalisa','bhaktamar-stotra'].includes(p.id));
    resultBox.replaceChildren();
    if(!found.length){const p=document.createElement('p');p.className='search-empty';p.textContent='No exact match. Try “Geeta”, “Sundarkand”, “Bhaktamar” or a Hindi name.';resultBox.append(p);return;}
    found.forEach(product=>{
      const a=document.createElement('a');a.className='search-result';a.href=product.slug;
      const im=document.createElement('img');im.src=product.images[0];im.alt='';im.width=68;im.height=68;im.loading='lazy';
      const text=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small'),arrow=document.createElement('span');
      title.textContent=product.name;sub.textContent=product.categoryLabel+' · '+product.hindi;arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');arrow.style.flex='none';
      text.append(title,sub);a.append(im,text,arrow);resultBox.append(a);
    });
  }
  $$('[data-open-search]').forEach(button=>button.addEventListener('click',()=>{globalSearch.value='';renderResults();openDialog(searchDialog);globalSearch.focus();}));
  globalSearch?.addEventListener('input',()=>renderResults(globalSearch.value));
  /* Collection filters are reflected in the URL so links are shareable. */
  const collectionSearch=$('#collection-search'), filters=$$('[data-filter]'), cards=$$('.catalogue-grid [data-product-id]');
  if(collectionSearch && cards.length){
    const params=new URLSearchParams(location.search);
    let selected=params.get('category')||'all';if(!filters.some(b=>b.dataset.filter===selected))selected='all';
    collectionSearch.value=params.get('q')||'';
    $('[data-filter-tools]').hidden=false;
    function filterProducts(updateURL=true){
      let count=0;const query=collectionSearch.value;
      cards.forEach(card=>{
        const p=products.find(item=>item.id===card.dataset.productId);
        const categoryOK=selected==='all'||p?.category===selected||(selected==='jain'&&p?.id==='silver-bhaktamar-stotra');
        const visible=!!p&&categoryOK&&matches(p,query);card.hidden=!visible;if(visible)count++;
      });
      filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===selected)));
      $('#collection-count').textContent=count+' '+(count===1?'granth':'granths')+' to explore';
      $('#no-products').hidden=count!==0;
      if(updateURL){const url=new URL(location.href);selected==='all'?url.searchParams.delete('category'):url.searchParams.set('category',selected);query.trim()?url.searchParams.set('q',query.trim()):url.searchParams.delete('q');history.replaceState(null,'',url);}
    }
    filters.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.filter;filterProducts();}));
    collectionSearch.addEventListener('input',()=>filterProducts());
    $('#reset-filters')?.addEventListener('click',()=>{selected='all';collectionSearch.value='';filterProducts();collectionSearch.focus();});
    filterProducts(false);
  }
  /* Product gallery, with full-size modal and keyboard previous/next. */
  const gallery=$('[data-gallery]'), photoDialog=$('#photo-dialog');
  if(gallery){
    const thumbnails=$$('[data-photo]',gallery),hero=$('.main-photo img',gallery);let current=0;
    function selectPhoto(index){current=(index+thumbnails.length)%thumbnails.length;const b=thumbnails[current];hero.src=b.dataset.photo;hero.alt=b.dataset.photoAlt;thumbnails.forEach((t,i)=>t.setAttribute('aria-pressed',String(i===current)));if(photoDialog.open)showZoom();}
    function showZoom(){$('#zoom-photo').src=thumbnails[current].dataset.photo;$('#zoom-photo').alt=thumbnails[current].dataset.photoAlt;$('#zoom-caption').textContent=(current+1)+' / '+thumbnails.length+' · '+thumbnails[current].dataset.photoAlt;}
    thumbnails.forEach((button,i)=>button.addEventListener('click',()=>selectPhoto(i)));
    $('[data-zoom]',gallery).addEventListener('click',()=>{showZoom();openDialog(photoDialog);});
    $('.photo-prev').addEventListener('click',()=>selectPhoto(current-1));$('.photo-next').addEventListener('click',()=>selectPhoto(current+1));
    photoDialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();selectPhoto(current+1);}if(event.key==='ArrowLeft'){event.preventDefault();selectPhoto(current-1);}});
  }
  /* The customer reviews and sends the WhatsApp enquiry. Nothing is sent automatically. */
  const order=$('.product-enquiry');
  if(order){
    const quantity=$('#quantity'),purpose=$('#purpose');
    function syncOrder(){
      const count=Number(quantity.value);const valid=Number.isInteger(count)&&count>=1&&count<=10000;
      const message='Radhe Radhe! I am interested in '+order.dataset.product+'.\nQuantity: '+(valid?count:1)+'\nChoosing for: '+purpose.value+'\nPlease confirm the edition, current quotation, availability and delivery details.';
      $$('.enquire-link').forEach(link=>{link.href=whatsapp(message);});
      $('[data-quantity="-1"]').disabled=valid&&count<=1;$('[data-quantity="1"]').disabled=valid&&count>=10000;
    }
    $$('[data-quantity]').forEach(button=>button.addEventListener('click',()=>{quantity.value=Math.max(1,Math.min(10000,(Number(quantity.value)||1)+Number(button.dataset.quantity)));syncOrder();}));
    quantity.addEventListener('input',syncOrder);quantity.addEventListener('change',()=>{quantity.value=Math.max(1,Math.min(10000,Math.floor(Number(quantity.value)||1)));syncOrder();});purpose.addEventListener('change',syncOrder);
    $$('.enquire-link').forEach(a=>a.addEventListener('click',event=>{if(!quantity.reportValidity()){event.preventDefault();quantity.focus();}}));
    order.addEventListener('submit',event=>{event.preventDefault();if(order.reportValidity())window.open($('.enquire-link').href,'_blank','noopener');});syncOrder();
  }
  const gift=$('#gift-form');
  if(gift){
    const occasion=$('#gift-occasion'),date=$('#gift-date'),given=new URLSearchParams(location.search).get('occasion');
    if(given&&[...occasion.options].some(o=>o.value===given))occasion.value=given;
    const now=new Date();date.min=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    $$('[data-occasion]').forEach(a=>a.addEventListener('click',()=>{occasion.value=a.dataset.occasion;}));
    gift.addEventListener('submit',event=>{
      event.preventDefault();if(!gift.reportValidity())return;
      const data=new FormData(gift);
      const message='Radhe Radhe! I would like to plan a MyPandulipi gift order.\nOccasion: '+occasion.selectedOptions[0].text+'\nQuantity: '+data.get('quantity')+'\nGranth: '+data.get('product')+'\nDelivery city / PIN: '+String(data.get('city')).trim()+(data.get('date')?'\nPreferred date: '+data.get('date'):'')+(String(data.get('notes')).trim()?'\nNotes: '+String(data.get('notes')).trim():'')+'\nPlease share suitable packaging, availability, a quotation and delivery details.';
      const link=whatsapp(message);$('#gift-ready').href=link;$('#gift-feedback').hidden=false;
      window.open(link,'_blank','noopener');
    });
    gift.addEventListener('input',()=>{$('#gift-feedback').hidden=true;});
  }
  $$('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='Copied ✓';button.setAttribute('aria-label','Coupon Navratri copied');}
    catch{button.textContent=button.dataset.copy;button.setAttribute('aria-label','Coupon code: Navratri. Select and copy the code.');}
  }));
})();
