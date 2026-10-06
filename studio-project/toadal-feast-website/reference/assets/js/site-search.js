(function(){
  'use strict';
  function baseRoot(){
    var brand=document.querySelector('.site-brand');
    var p=brand?new URL(brand.href,location.href).pathname:'/';
    return p==='/'?'':p.replace(/\/+$/,'');
  }
  function norm(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();}
  function absoluteRoute(route){var base=baseRoot(); return base+(route&&route.startsWith('/')?route:'/'+(route||''));}
  function score(entry,q){
    var needle=norm(q); if(!needle) return 0;
    var rawTitle=String(entry.title||'').replace(/\s*[·—-]\s*TOADAL FEAST\s*$/i,'');
    var title=norm(rawTitle), summary=norm(entry.summary), metadata=norm([entry.group,entry.category,entry.status].join(' '));
    var tokens=needle.split(/\s+/).filter(function(token){return token.length>1;});
    var combined=title+' '+summary+' '+metadata;
    if(tokens.length>1&&!tokens.every(function(token){return combined.includes(token);})) return 0;
    var brandOnly=tokens.length===1&&(tokens[0]==='toadal'||tokens[0]==='feast');
    var total=0;
    if(title===needle) total+=100;
    if(title.startsWith(needle)) total+=45;
    if(title.includes(needle)) total+=30;
    if(!brandOnly&&summary.includes(needle)) total+=12;
    if(!brandOnly&&metadata.includes(needle)) total+=8;
    for(var token of tokens){ if(title.includes(token)) total+=6; if(!brandOnly&&token.length>2&&summary.includes(token)) total+=2; }
    return total;
  }
  function initSiteSearch(){
    var form=document.querySelector('[data-site-search]'); if(!form) return;
    var input=form.querySelector('[data-search-input]');
    var category=form.querySelector('[data-search-category]');
    var results=document.querySelector('[data-search-results]');
    var status=document.querySelector('[data-search-status]');
    var suggestions=Array.prototype.slice.call(document.querySelectorAll('[data-search-suggestion]'));
    if(!input||!category||!results||!status) return;
    var index=[];
    function routeLink(route){var a=document.createElement('a');a.href=absoluteRoute(route);return a;}
    function render(){
      var q=input.value.trim(), group=category.value;
      results.replaceChildren();
      if(!q){status.textContent='Type a word or choose a suggestion. Suggestions are editorial shortcuts, not popularity rankings.';return;}
      var matches=index.map(function(e){return {e:e,s:score(e,q)};}).filter(function(x){return x.s>0&&(group==='All'||x.e.group===group);}).sort(function(a,b){return b.s-a.s||a.e.title.localeCompare(b.e.title);}).slice(0,40);
      status.textContent=matches.length?matches.length+' local result'+(matches.length===1?'':'s')+' for “'+q+'”.':'No local results for “'+q+'”.';
      for(var item of matches){
        var card=document.createElement('article'); card.className='search-result-card';
        var meta=document.createElement('p');meta.className='section-kicker';meta.textContent=item.e.group+(item.e.publicationState&&item.e.publicationState!=='SURFACE'?' · '+item.e.publicationState:'');
        var h=document.createElement('h2');var a=routeLink(item.e.route);a.textContent=item.e.title;h.appendChild(a);
        var p=document.createElement('p');p.textContent=item.e.summary||'Open this TOADAL FEAST section.';
        card.append(meta,h,p);results.appendChild(card);
      }
    }
    function syncUrl(){var u=new URL(location.href); if(input.value.trim())u.searchParams.set('q',input.value.trim());else u.searchParams.delete('q'); if(category.value!=='All')u.searchParams.set('category',category.value);else u.searchParams.delete('category'); history.replaceState(null,'',u.pathname+u.search+u.hash);}
    form.addEventListener('submit',function(e){e.preventDefault();syncUrl();render();});
    input.addEventListener('input',function(){render();});
    category.addEventListener('change',function(){syncUrl();render();});
    suggestions.forEach(function(button){button.addEventListener('click',function(){input.value=button.getAttribute('data-search-suggestion')||'';category.value='All';syncUrl();render();input.focus();});});
    var params=new URLSearchParams(location.search); input.value=params.get('q')||''; var requested=params.get('category'); if(requested&&Array.from(category.options).some(function(o){return o.value===requested;}))category.value=requested;
    fetch(baseRoot()+'/assets/data/local-search-index.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('search-index-'+r.status);return r.json();}).then(function(data){index=Array.isArray(data.entries)?data.entries:[];render();}).catch(function(){status.textContent='Local search index is unavailable. Use the navigation or Support page instead.';});
  }
  function initSupportSearch(){
    var input=document.querySelector('[data-support-search]');if(!input)return;
    var cards=Array.prototype.slice.call(document.querySelectorAll('[data-support-article]'));
    var details=cards.filter(function(card){return card.tagName==='DETAILS';});
    var count=document.querySelector('[data-support-count]');
    var filtering=false, beforeFilter=new Map(), expectedOpen=new Map();
    function setOpen(card,open){expectedOpen.set(card,open);card.open=open;}
    function rememberUserOpen(card){
      if(filtering&&card.open!==expectedOpen.get(card))beforeFilter.set(card,card.open);
      expectedOpen.set(card,card.open);
    }
    details.forEach(function(card){expectedOpen.set(card,card.open);card.addEventListener('toggle',function(){rememberUserOpen(card);});});
    function render(){
      var q=norm(input.value), visible=0;
      details.forEach(rememberUserOpen);
      // Search temporarily opens matching answers; clearing restores prior or reader-chosen states.
      if(q&&!filtering){details.forEach(function(card){beforeFilter.set(card,card.open);});filtering=true;}
      else if(!q&&filtering){filtering=false;details.forEach(function(card){setOpen(card,beforeFilter.get(card));});beforeFilter.clear();}
      cards.forEach(function(card){
        var hay=norm(card.getAttribute('data-support-text')+' '+card.textContent);
        var show=!q||hay.includes(q)||q.split(/\s+/).every(function(t){return !t||hay.includes(t);});
        card.hidden=!show;if(show){visible+=1;if(q&&card.tagName==='DETAILS')setOpen(card,true);}
      });
      if(count)count.textContent=visible+' help topic'+(visible===1?'':'s')+' shown.';
    }
    function revealTopic(hash,focus){
      var id;try{id=decodeURIComponent(hash.replace(/^#/,''));}catch(error){return;}
      var card=cards.find(function(topic){return topic.id===id;});if(!card)return;
      input.value='';render();
      if(card.tagName==='DETAILS')setOpen(card,true);
      var summary=card.querySelector('summary');
      if(focus&&summary)window.requestAnimationFrame(function(){if(!card.hidden)summary.focus({preventScroll:true});});
    }
    Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function(link){
      link.addEventListener('click',function(event){
        if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        var target=new URL(link.href,location.href), current=new URL(location.href);
        if(target.origin===current.origin&&target.pathname===current.pathname&&target.search===current.search)revealTopic(target.hash,event.detail===0);
      });
    });
    input.addEventListener('input',render);render();
    if(location.hash)revealTopic(location.hash,false);
    window.addEventListener('hashchange',function(){revealTopic(location.hash,false);});
  }
  function start(){initSiteSearch();initSupportSearch();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
