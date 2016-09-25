(function(module){

  module.easyRect = {
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
    getRelativeOffset:   function getRelativeOffset(event) {
      var e = event || window.event;
      var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
      var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      var x = (e.pageX || e.clientX) + scrollX;
      var y = (e.pageY || e.clientY) + scrollY;
      var elementOffset = elem.getBoundingClientRect();
      return {
        'o_offset_left': elementOffset.left,
        'o_offset_top': elementOffset.top,
        'left': x - (elementOffset.left >= 0 ? (elementOffset.left): (2 * scrollX + elementOffset.left)),
        'top': y - (elementOffset.top >= 0 ? (elementOffset.top) : (2 * scrollY + elementOffset.top))
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
      var result;
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
    eventsHanlders: {
      _endDraw:   function _endDraw(){
        var newDiv, textTitle, closeBtn;
        if(!this.newSection) return;

        newDiv = document.createElement('div');
        newDiv.classList.add('rect-section__title');

        textTitle = document.createElement('span');
        textTitle.textContent = this.newSectionId;
        closeBtn = document.createElement('span');
        closeBtn.classList.add('rect-section__btn-close');
        closeBtn.textContent = 'x';

        newDiv.appendChild(textTitle);
        newDiv.appendChild(closeBtn);
        this.newSection.appendChild(newDiv);
        this.sectionCnt++;

        this.removeEventListener(elem, 'mousemove', '_onMove');
        this.removeEventListener(elem, 'mouseup', '_endDraw');

        // reset the references
        this.sectionBoxOption = null;
        this.newSection = null;
        this.newSectionId = null;
        this.isMousedown = false;
      },
      _onMove: function _onMove(ievt){
        var newOffset = this.getRelativeOffset(ievt);
        if(!this.isMousedown) return;

        if(!this.newSection){
            this.newSection = document.createElement('div');
            this.newSection.classList.add('rect-section');
            this.newSection.dataset['sectionId'] = this.newSectionId;
            elem.appendChild(this.newSection);
        }

        this.sectionBoxOption.left =  Math.min(this.sectionBoxOption.origin_left, newOffset.left)  + 'px';
        this.sectionBoxOption.top = Math.min(this.sectionBoxOption.origin_top, newOffset.top )  + 'px';

        if(newOffset.left < this.sectionBoxOption.origin_left){
          // If the new offset is less than the origin left, it stands for we drag the region from right to left
          // The offset left = new offset left - the origin offset left
          // The width = new offset left - the origin offset left, but it can not be greater than this.sectionBoxOption.origin_left
          this.sectionBoxOption.left = newOffset.left  + 'px';
          this.sectionBoxOption.width = Math.min(Math.abs(this.sectionBoxOption.origin_left), Math.abs(newOffset.left - this.sectionBoxOption.origin_left)) + 'px';
        }else{
          // If the new offset is greater than the origin left, it stands for we drag the region from left to right
          // The offset left = the orginal offset left
          // The width = new offset left - origin offset left, but it can not be greater that the subtraction of (320 - this.sectionBoxOption.origin_left)
          this.sectionBoxOption.left = this.sectionBoxOption.origin_left  + 'px';
          this.sectionBoxOption.width = Math.min(Math.abs(this.maxWidth - this.sectionBoxOption.origin_left), Math.abs(newOffset.left - this.sectionBoxOption.origin_left)) + 'px';
        }


        if(newOffset.top < this.sectionBoxOption.origin_top){
          // If the new offset is less than the origin top, it stands for we drag the region from right to top
          // The offset top = new offset top - the origin offset top
          // The width = new offset top - the origin offset top, but it can not be greater than this.sectionBoxOption.origin_top
          this.sectionBoxOption.top = newOffset.top  + 'px';
          this.sectionBoxOption.height = Math.min(Math.abs(this.sectionBoxOption.origin_top), Math.abs(newOffset.top - this.sectionBoxOption.origin_top)) + 'px';
        }else{
          // If the new offset is greater than the origin top, it stands for we drag the region from top to right
          // The offset top = the orginal offset top
          // The width = new offset top - origin offset top, but it can not be greater that the subtraction of (320 - this.sectionBoxOption.origin_top)
          this.sectionBoxOption.top = this.sectionBoxOption.origin_top  + 'px';
          this.sectionBoxOption.height = Math.min(Math.abs(this.maxHeight - this.sectionBoxOption.origin_top), Math.abs(newOffset.top - this.sectionBoxOption.origin_top)) + 'px';
        }

        this.newSection.setAttribute('style', 'width: ' + this.sectionBoxOption.width + ';height:' + this.sectionBoxOption.height + ';left:' + this.sectionBoxOption.left + ';top:' + this.sectionBoxOption.top);
      },
      mousedownHandler: function mousedownHandler(evt){
        if(!this.hasClass(evt.target, 'rect-section__btn-close') && !this.isMousedown) {
          this.isMousedown = true;
          this.newSectionId = this.sectionIndex++;
          this.sectionBoxOption = this.getRelativeOffset(evt);
          this.sectionBoxOption.origin_left = this.sectionBoxOption.left;
          this.sectionBoxOption.origin_top = this.sectionBoxOption.top;
          // Bind events
          this.addEventListener(elem, 'mousemove', this.eventsHanlders._onMove);
          this.addEventListener(elem, 'mouseup', this.eventsHanlders._endDraw);
        }
      },
      clickHandler: function clickHandler(evt){
        var pElement = this.getParentNodeByClassName(evt.target, 'rect-section'), sectionId;
        if (pElement) {
          sectionId = pElement.dataset['section-id'];
          pElement.remove();
          this.sectionCnt--;
        }

        evt.preventDefault();
        evt.stopPropagation();
      }
    },
    init: function init(elem){
      this.elem = elem;
      this.maxWidth = elem.offsetWidth;
      this.maxHeight = elem.offsetHeight;

      // bind events
      this.addEventListener(this.elem, 'mousedown', this.eventsHanlders.mousedownHandler, false);
      this.addEventListener(this.elem, 'click', this.eventsHanlders.clickHandler, false);
    }
  }
;

  window.onload = function(){
    elem = document.getElementById('rect-region'); 
    module.easyRect.init(elem);
  };
})(window);