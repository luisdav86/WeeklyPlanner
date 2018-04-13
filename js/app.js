
var constants={
    HIDE_STYLE : "none",
    HOUR_DIV : '<div class="hour {{event}}" id="{{id}}">'+
                    "{{hour}}:00"+
               '</div>',
    DAY_DIV:   '<div class="{{view}} {{weekend}}" id="{{id}}">'+
                     '{{header}}'+
                     '{{body}}' +
               '</div>',
    DATE_SPLIT: '-',
    HEADER: '<div class="title"><strong>{{title}}</strong></div>',
    WEEK_VIEW: "week",
    DAY_VIEW: "singleDay"
}

var eventModel = {
        init: function() {
            if (!localStorage.events) {
                localStorage.events = JSON.stringify({});
            }
            if (!localStorage.eventMap) {
                localStorage.eventMap = JSON.stringify({});
            }
        },

        getEventMap:function(){
                return JSON.parse(localStorage.eventMap);
        },

        getAll: function(){
            return JSON.parse(localStorage.events);
        },

        getEventsByDay : function(day){
            var allEvents= this.getAll();
            var events=[];
            var dayMap = this.getEventMap()[day];
            if(dayMap!==undefined){
                for (var i = 0; i < dayMap.length; i++) {
                    if(dayMap[i]!==null){
                        events[i] = allEvents[dayMap[i]];
                    }
                }
            }
            return events;
        },

        getEvent: function(day, hour){
            var allEvents= this.getAll();
            var dayMap = this.getEventMap()[day];
            return dayMap!==undefined?allEvents[dayMap[parseInt(hour)]]:undefined;
        },

        add: function(event){
             var events = this.getAll();
             var eventMap = this.getEventMap();
             if(eventMap[event.day] === undefined){
                eventMap[event.day] =  [];
             }
             var startHour= parseInt(this.getStartHour(event));
             var endHour = parseInt(this.getEndHour(event));
             for (var i = startHour; i < endHour; i++) {
                 eventMap[event.day][i]= event.id;
             }
             events[event.id] = event;
             
             localStorage.eventMap = JSON.stringify(eventMap);
             localStorage.events = JSON.stringify(events);
        },

        delete: function(event){
            this.deleteEvent(event);
            this.deleteEventMap(event);
        },

        deleteEventMap: function(event){
            var eventMap = this.getEventMap();
            for (var i = 0; i < eventMap[event.day].length; i++) {
                 if(eventMap[event.day][i] ===event.id){
                    eventMap[event.day][i] =null
                }
            }
            localStorage.eventMap = JSON.stringify(eventMap);
        },

        deleteEvent: function(event){
             var events = this.getAll();
             events[event.id]=null;
             delete events[event.id];
             localStorage.events = JSON.stringify(events);
        },

        isSpaceAvailable : function(selectedDay, event){
            var events = eventModel.getEventsByDay(selectedDay);
                if(events!==undefined){
                     var startHour= parseInt(this.getStartHour(event));
                     var endHour = parseInt(this.getEndHour(event));
                     for (var i = startHour; i < endHour; i++) {
                         if(events[i] !== null && events[i]!==undefined && events[i].id !== event.id){
                            return false;
                         }
                     }
                }
            return true;
        },

        getStartHour: function(event){
            return this.getEventHour("startTime", event);
        },

        getEndHour: function(event){
            var endTime = this.getEventHour("endTime", event);
            return parseInt(endTime) ===0? 24: endTime;
        },

        getEventHour:function(property, event){
         return event[property].substring(0,2);
        }
}

var model = {
        init: function() {
        },

        getWeek: function(date){
            var week=[]
            var firstDay =  date.getDate() - date.getDay();
            for (var i = 0; i < 7; i++) {
                var dayOfWeek = this.buildDay(date, firstDay, i);
                week.push(dayOfWeek);
            }
            return week;
        },

        buildDay: function(date, firstDay, day){
                var firstDate = new Date(date.getUTCFullYear(), date.getMonth(), firstDay+day);
                var dayTitle = this.getDaysOfTheWeek(firstDate.getDay()) + " " + firstDate.getUTCDate();;
                return this.createDayModel(firstDate.getDay(), dayTitle, firstDate);
        },

        createDayModel: function(number, name, date){
            return {
                number: number,
                name: name,
                date: date,
                getDateId : function(){
                    return this.date.getFullYear() + constants.DATE_SPLIT+ model.addCero((this.date.getMonth() + 1)) + constants.DATE_SPLIT + model.addCero(this.date.getUTCDate());
                },
                isWeekend: function(){
                   var currentDay =  model.getDaysOfTheWeek(this.date.getDay());
                   return currentDay === model.getDaysOfTheWeek(0) || currentDay===model.getDaysOfTheWeek(6);
                }
            };
        },

        addCero:function(value){
            if(value<10){
                return "0"+value;
            }
            return value;
        },

        getDayKey: function(day){
            return day.substring(0, 10);
        },

        getHourFromKey: function(key){
            return key.split(constants.DATE_SPLIT)[3];
        },

        getDaysOfTheWeek : function(dayIndex){
             return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];
         },

        addDays: function (date, days) {
          var result = new Date(date);
          result.setDate(result.getDate() + days);
          return result;
        }
        
}

var view ={
    init: function() {
      this.container = document.getElementById("container");
      this.dialog = document.getElementById("addEventDialog");
      this.startTime = document.getElementById("timeStart");
      this.endTime = document.getElementById("timeEnd");
      this.type = document.getElementById("appointmentType");
      this.viewType = document.getElementById("viewType");
      this.saveButton = document.getElementById("saveButton");
      this.updateButton = document.getElementById("updateButton");
      this.deleteButton = document.getElementById("deleteButton");
      this.updateButton.style.display=constants.HIDE_STYLE;
      this.saveButton.style.display=constants.HIDE_STYLE;
      this.deleteButton.style.display=constants.HIDE_STYLE;
      view.render();
    },

    next: function(){
        this.move(controller.move());
    },

    prior: function(){
        this.move((-1)*controller.move());
    },

    changeView: function(){
        controller.selectedView = this.viewType.value;
        view.render();
    },

    move: function(days){
        controller.selectedWeekDay = model.addDays(controller.selectedWeekDay, days);
        view.render();
    },

    validateTime: function(){
        var valid = this.startTime.value<((this.endTime.value==="00:00")?"24:00":this.endTime.value);
        if(valid){
            var event = this.buildEvent();
            if(controller.selectedEvent!==undefined && controller.selectedEvent!==null){
                event.id = controller.selectedEvent.id
            }
            valid = controller.validate(event);
        }
        this.updateButton.disabled =!valid;
        this.saveButton.disabled =!valid;
    },

    saveEvent: function(){
        var event = this.buildEvent();
        event.type = this.type.value;
        if(controller.saveEvent(event)){
            view.render();
        }
    },

    confirmDelete:function(){
        var result = confirm("Do you want to delete the event?");
        if (result) {
            this.deleteEvent();
        }
    },

    updateEvent: function(){
        var event = this.buildEvent();
        event.id = controller.selectedEvent.id;
        event.type = this.type.value;
        if(controller.updateEvent(event)){
            view.render();
        }
    },

    buildEvent: function(){
        return {
                    startTime:this.startTime.value,
                    endTime:this.endTime.value,
                    day: controller.selectedDay,
                    id: new Date().getTime()
                }

    },

    deleteEvent: function(){
        controller.deleteEvent();
        this.updateButton.style.display=constants.HIDE_STYLE;
        this.saveButton.style.display=constants.HIDE_STYLE;
        this.deleteButton.style.display=constants.HIDE_STYLE;
        view.render();
    },

    render: function(){
        var html = '';
        var self = this;
        var daysToShow =[];
        var weekView = controller.selectedView === constants.WEEK_VIEW;
        if(weekView){
            daysToShow =controller.getWeek();
        }else
        {
            daysToShow.push(controller.getDay());
        }

        daysToShow.forEach(function(date){
                var dateId = date.getDateId();
                var events = controller.getEventsByDay(dateId);
                var weekend="";
                html += constants.DAY_DIV;
                html = html.replace("{{view}}", weekView?constants.WEEK_VIEW:constants.DAY_VIEW);
                html = html.replace("{{header}}", constants.HEADER);
                html = html.replace("{{title}}", date.name);
                html = html.replace("{{body}}", self.getAllHoursView(dateId, events));
                html = html.replace("{{id}}", dateId);
                if(date.isWeekend()){
                    weekend ="weekend";
                }
                html = html.replace("{{weekend}}", weekend);
            });
      this.container.innerHTML= html;
      this.addClickListener();
    },

    addClickListener : function(){
        var classname = document.getElementsByClassName("hour");
        for (var i = 0; i < classname.length; i++) {
                classname[i].addEventListener('click', function(time){
                    view.updateInformation(time.currentTarget.id);
                }, false);
            }
    },

    getAllHoursView: function(date, dayEvents){
         var html = '';
        for (var i = 1; i <= 23; i++) {
             var event = dayEvents[i];
             html += this.getHourView(i, date, event);
        }
        return html;
    },

    getHourView: function(hour, id, event){
        var eventClass ="";
        var html = constants.HOUR_DIV;
        html = html.replace("{{hour}}", hour);
        if(event!== undefined && event!==null){
            eventClass= event.type;
        }
        html = html.replace("{{event}}", eventClass);
      return html.replace("{{id}}", id+"-"+model.addCero(hour));
    },

    updateInformation : function(selectedTime) {
       controller.selectedDay = model.getDayKey(selectedTime);
       var startTime = model.getHourFromKey(selectedTime);
       var endTime = parseInt(startTime) +1;
            if(endTime == 24){
                endTime="0";
            }
       var event = eventModel.getEvent(controller.selectedDay, startTime);
       if(event === null || event === undefined){
               startTime = ""+startTime+":00";
               endTime = ""+ (model.addCero(endTime)) +":00";
               this.showUpdateMode(false);
        }else{
            startTime= event.startTime;
            endTime= event.endTime;
            this.type.value =event.type;
            this.showUpdateMode(true);
        }
        controller.selectedEvent = event;

        this.startTime.value =startTime;
        this.endTime.value = endTime;
    },

    showUpdateMode: function(show){
        if(show){
            this.saveButton.style.display=constants.HIDE_STYLE;
            this.updateButton.style.display="";
            this.deleteButton.style.display="";
        }else{
            this.saveButton.style.display="";
            this.updateButton.style.display=constants.HIDE_STYLE;
            this.deleteButton.style.display=constants.HIDE_STYLE;
        }
    }
}

var controller = {
    init: function() {
        eventModel.init();
        view.init();
    },
    selectedWeekDay: new Date(),
    selectedDay: undefined,
    selectedView: constants.WEEK_VIEW,
    selectedEvent: undefined,

    move: function(){
        if(this.selectedView == constants.WEEK_VIEW)
            return 7;
        else
            return 1;
    },

    getCurrentWeek: function(){
        return model.getCurrentWeek();
    },

    getWeek : function(){
        return model.getWeek(this.selectedWeekDay);
    },

    getDay : function(){
            return model.buildDay(this.selectedWeekDay, this.selectedWeekDay.getUTCDate(), 0);
    },

    getEventsByDay:function(dayId){
        return eventModel.getEventsByDay(dayId);
    },

    saveEvent: function(event){
        var saved=false;
        if(this.validate(event)){
            eventModel.add(event);
            saved = true;
        }
        return saved;
    },

    updateEvent: function(event){
        var updated=false;
        if(this.validate(event)){
            eventModel.deleteEventMap(event);
            eventModel.add(event);
            updated = true;
        }
        return updated;
    },

    validate: function(event){
        return eventModel.isSpaceAvailable(this.selectedDay, event);
    },

    deleteEvent: function(){
        if(this.selectedEvent!==undefined){
            eventModel.delete(this.selectedEvent);
        }
    }
}

controller.init();