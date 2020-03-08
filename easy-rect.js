(function(module){

  module.easyRect = {
    lastPoint: null,
    isMousedown: false,
    sectionIndex: 0,
    sectionBoxOption: null,
    newSection: null,
    newSectionId: 0,
    elem: null,
    sectionCnt: 0,
    eventsStore: {},
    maxWidth: 200,
    maxHeight: 200,
    getMousePositionRelativeToScreen: function(event){
      const e = event || window.event;
      return {'x':e.clientX,'y':e.clientY}
    },
    getMousePositionRelativeToDocument: function(event){
        const e = event || window.event;
        const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        const x = e.pageX || e.clientX + scrollX;
        const y = e.pageY || e.clientY + scrollY;
        return { 'x': x, 'y': y, scrollX: scrollX, scrollY: scrollY };
    },
    getRelativeOffset: function getRelativeOffset(event) {
      const {x, y, scrollX, scrollY} = this.getMousePositionRelativeToDocument(event);
      const elementOffset = this.elem.getBoundingClientRect();
      return {
        'o_offset_left': elementOffset.left,
        'o_offset_top': elementOffset.top,
        'left': x - (elementOffset.left >= 0 ? (elementOffset.left): (scrollX + elementOffset.left)),
        'top': y - (elementOffset.top >= 0 ? (elementOffset.top) : (scrollY + elementOffset.top))
      };
    },
    getOffsetOfDOM: function(element){
      const rect = element.getBoundingClientRect();
      const scrollTop = window.scrollTop || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop || 0;
      const scrollLeft = window.scrollLeft || (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft || 0;
    
      const html = document.documentElement || document.getElementsByTagName('html')[0];
    
      let deviation = html.getBoundingClientRect();
      deviation = {
        left:   deviation.left < 0 ? 0 : deviation.left,
        top:    deviation.top < 0 ? 0 : deviation.top
      };
    
      return {
        x: rect.left + scrollLeft - deviation.left,
        y: rect.top + scrollTop - deviation.top
      };
    },
    getOffsetOfChild: function getOffsetOfChild(event, parent) {
      const {x, y, scrollX, scrollY} = this.getMousePositionRelativeToDocument(event);
      const elementOffset = this.getOffsetOfDOM(parent);
      return {
        'o_offset_left': elementOffset.x,
        'o_offset_top': elementOffset.y,
        'left': x - elementOffset.x,
        'top': y - elementOffset.y
      };
    },
    isFunction: function isFunction(varName) {
        return typeof varName === 'function';
    },

    removeEventListener: function removeEventListener(element, eventType, eventHandler, useCapture, callback){

      if(this.eventsStore[eventType]){

          if (element.removeEventListener) {
            element.removeEventListener(eventType, this.eventsStore[eventType], useCapture);
          }

          if (element.detachEvent) {
              element.detachEvent('on' + eventType, this.eventsStore[eventType]);
          }
      }

      if(this.isFunction(callback)){
        callback();
      }

      return true;
    },
    addEventListener: function addEventListener(element, eventType, eventHandler, useCapture) {
        this.eventsStore[eventType] = eventHandler.bind(this);

        if (element.addEventListener) {
            element.addEventListener(eventType, this.eventsStore[eventType], useCapture);
            return true;
        }

        if (element.attachEvent) {
            return element.attachEvent('on' + eventType, this.eventsStore[eventType]);
        }

        element['on' + eventType] = eventHandler;
    },
    hasClass: function(element, className){
      let result;
      if ( element.classList ){
        result = element.classList.contains(className); 
      } else {
        result = new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
      }

      return !!result;
    },
    getParentNodeByClassName: function(element, className){
      if(this.hasClass(element, className)){
          return element;
      }else{
        while(element.parentNode){
          if(this.hasClass(element.parentNode, className)){
            return element.parentNode;
          }else{
            element = element.parentNode;
          }
        }
      }
      return false;
    },
    _reset: function _reset(){
      // reset the references
      this.sectionBoxOption = null;
      this.newSection = null;
      this.newSectionId = null;
      this.isMousedown = false;
      this.isMoving = false;
      this.isTriggerKeyPressed = false;
      this.lastPoint = null;
    },
    _muteSelection: function _muteSelection(){
       // mute text selection
       window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
    },
    _shouldTriggerMouseDown: function(evt){
      const should = this.isTriggerKeyPressed || 
                     this.hasClass(evt.target, 'rect-section__resizer') || 
                     this.hasClass(evt.target, 'rect-section__title');
      return should;
    },
    eventsHanlders: {
      _endDraw:   function _endDraw(){
        if(
           !this.newSection || 
           parseFloat(this.newSection.style.width) < 20 || 
           parseFloat(this.newSection.style.height) < 20
        ) {
           return;
        }
        const content = `
          <div class="rect-section__title">
            <span>${this.newSectionId}</span>
            <span class="rect-section__btn-close">x</span>
            <span class="rect-section__resizer"></span>
          </div>
        `;
        this.newSection.innerHTML = content;
        this.sectionCnt++;

        this.removeEventListener(this.elem, 'mousemove', '_onMove');
        this.removeEventListener(this.elem, 'mouseup', '_endDraw');

        this._reset();
      },
      _onMove: function _onMove(ievt){
        const newOffset = this.getRelativeOffset(ievt);
        if(!this.isMousedown) return;
        this._muteSelection();
        if(!this.newSection){
            this.newSection = document.createElement('div');
            this.newSection.classList.add('rect-section');
            this.newSection.dataset['sectionId'] = this.newSectionId;
            this.elem.appendChild(this.newSection);
        }

        const sectionBoxOption = this.sectionBoxOption;
        const isMoving = this.isMoving;
        const origin_left = sectionBoxOption.origin_left;
        const origin_top = sectionBoxOption.origin_top;

        if(isMoving){
          const dx = sectionBoxOption.dx;
          const dy = sectionBoxOption.dy;
          if(!this.lastPoint){
            if(newOffset.left !== origin_left){
              sectionBoxOption.left = `${newOffset.left - dx}px`;
            }
            if(newOffset.top !== origin_top){
              sectionBoxOption.top = `${newOffset.top - dy}px`;
            }
          } else {
            if(newOffset.left !==  this.lastPoint[0]){
              sectionBoxOption.left = `${newOffset.left - dx}px`;
            }
            if(newOffset.top !==  this.lastPoint[1]){
              sectionBoxOption.top = `${newOffset.top - dy}px`;
            }
          }
          this.lastPoint = [newOffset.left, newOffset.top];
        } else {
          sectionBoxOption.left =  Math.min(sectionBoxOption.origin_left, newOffset.left)  + 'px';
          sectionBoxOption.top = Math.min(sectionBoxOption.origin_top, newOffset.top )  + 'px';
          if(newOffset.left < origin_left){
            // If the new offset is less than the origin left, it stands for we drag the region from right to left
            // The offset left = new offset left - the origin offset left
            // The width = new offset left - the origin offset left, but it can not be greater than sectionBoxOption.origin_left
            sectionBoxOption.left = newOffset.left  + 'px';
            sectionBoxOption.width = Math.min(Math.abs(origin_left), Math.abs(newOffset.left - origin_left)) + 'px';
          }else{
            // If the new offset is greater than the origin left, it stands for we drag the region from left to right
            // The offset left = the orginal offset left
            // The width = new offset left - origin offset left, but it can not be greater that the subtraction of (320 - sectionBoxOption.origin_left)
            sectionBoxOption.left = origin_left  + 'px';
            sectionBoxOption.width = Math.min(this.maxWidth, Math.abs(this.elem.offsetWidth - origin_left), Math.abs(newOffset.left - origin_left) ) + 'px';
          }
          if(newOffset.top < origin_top){
            // If the new offset is less than the origin top, it stands for we drag the region from right to top
            // The offset top = new offset top - the origin offset top
            // The width = new offset top - the origin offset top, but it can not be greater than sectionBoxOption.origin_top
            sectionBoxOption.top = newOffset.top  + 'px';
            sectionBoxOption.height = Math.min(Math.abs(origin_top), Math.abs(newOffset.top - origin_top) ) + 'px';
          }else{
            // If the new offset is greater than the origin top, it stands for we drag the region from top to right
            // The offset top = the orginal offset top
            // The width = new offset top - origin offset top, but it can not be greater that the subtraction of (320 - sectionBoxOption.origin_top)
            sectionBoxOption.top = origin_top  + 'px';
            sectionBoxOption.height = Math.min(this.maxHeight, Math.abs(this.elem.offsetHeight - origin_top), Math.abs(newOffset.top - origin_top) ) + 'px';
          }
        }

        this.newSection.setAttribute('style', [
            `width: ${sectionBoxOption.width}`,
            `height:${sectionBoxOption.height}`,
            `left:${sectionBoxOption.left}`,
            `top:${sectionBoxOption.top}`
          ].join(';')
        );
      },
      keydownHandler: function keydownHandler(evt){
        if(evt.shiftKey && evt.metaKey){
          this._muteSelection();
          this.isTriggerKeyPressed = evt.shiftKey && evt.metaKey;
        }
      },
      keyupHandler: function keydownHandler(evt){
        if(this.isTriggerKeyPressed){
          if(!evt.shiftKey || !evt.metaKey){
            this._reset();
          }
        }
      },
      handleResize: function handleResize(evt){
        if(this.hasClass(evt.target, 'rect-section__resizer')){
          const currentSection = evt.target.closest('.rect-section');
          if(currentSection){
            this.newSection = currentSection;
            this.newSectionId = this.newSection.dataset['sectionId'];
            this.sectionBoxOption = this.getRelativeOffset(evt);
            this.sectionBoxOption.origin_left = parseFloat(this.newSection.style.left);
            this.sectionBoxOption.origin_top = parseFloat(this.newSection.style.top);
          } else {
            this.eventsHanlders.handleCreate(evt);
          }
        }
      },
      handleMove: function handleMove(evt){
        if(this.hasClass(evt.target, 'rect-section__title')){
          const currentSection = evt.target.closest('.rect-section');

          if(currentSection){
            this.newSection = currentSection;
            this.newSectionId = this.newSection.dataset['sectionId'];
            this.sectionBoxOption = this.getRelativeOffset(evt);
            const {left, top} = this.getOffsetOfChild(evt, currentSection);
            this.sectionBoxOption.origin_left = parseFloat(this.newSection.style.left);
            this.sectionBoxOption.origin_top = parseFloat(this.newSection.style.top);
            this.sectionBoxOption.dx = left;
            this.sectionBoxOption.dy = top;
            this.sectionBoxOption.width = this.newSection.style.width;
            this.sectionBoxOption.height = this.newSection.style.height;
            this.isMoving = true;
          }
        }
      },
      handleCreate: function handleCreate(evt){
        if(this.isTriggerKeyPressed && !this.hasClass(evt.target, 'rect-section__resizer')){
          this.newSectionId = this.sectionIndex++;
          this.sectionBoxOption = this.getRelativeOffset(evt);
          this.sectionBoxOption.origin_left = this.sectionBoxOption.left;
          this.sectionBoxOption.origin_top = this.sectionBoxOption.top;
        }
      },
      mousedownHandler: function mousedownHandler(evt){
        if(
            !this.hasClass(evt.target, 'rect-section__btn-close') && 
            !this.isMousedown 
          ) {
          if(this._shouldTriggerMouseDown(evt)){
            this.isMousedown = true;
            this.eventsHanlders.handleCreate.call(this, evt);
            this.eventsHanlders.handleResize.call(this, evt);
            this.eventsHanlders.handleMove.call(this, evt);
            // Bind events
            this.addEventListener(this.elem, 'mousemove', this.eventsHanlders._onMove);
            this.addEventListener(this.elem, 'mouseup', this.eventsHanlders._endDraw);
          }
        }
      },
      clickHandler: function clickHandler(evt){
        if(this.hasClass(evt.target, 'rect-section__btn-close') && !this.isMoving){
          const pElement = evt.target.closest('.rect-section');
          if (pElement) {
            pElement.remove();
            this.sectionCnt--;
            evt.preventDefault();
            evt.stopPropagation();
          }
        }
      }
    },
    init: function init(elem, options){
      this.elem = elem || document.body;
      this.maxWidth = this.elem.offsetWidth;
      this.maxHeight = this.elem.offsetHeight;
      const _options = options || {};
      if(_options){
        if(typeof _options.maxWidth === 'number'){
          this.maxWidth = _options.maxWidth;
        }
        if(typeof _options.maxHeight === 'number'){
          this.maxHeight = _options.maxHeight;
        }
      }
      // bind events
      this.addEventListener(this.elem, 'keyup', this.eventsHanlders.keyupHandler, false);
      this.addEventListener(this.elem, 'keydown', this.eventsHanlders.keydownHandler, false);
      this.addEventListener(this.elem, 'mousedown', this.eventsHanlders.mousedownHandler, false);
      this.addEventListener(this.elem, 'click', this.eventsHanlders.clickHandler, false);
    }
  };
})(window);