% Model-based intelligent environments
% Assignment 2, groep 1; Sam van Leipsig, Michael Trouw & Sophie Nakou

clear all
close all

% The simulation parameters
start_time  = 0;
end_time = 10000;
delta_t = 1;
steps = (end_time - start_time) / delta_t;

% Domail model time step = 1 minute
background_soundlevel(1,1) = 0;
study_with_music(1,1 )= 0; 

% Sensor events
event.noise_level(1,1) = 0;
event.vibration(1,1) = 0;
event.display_activity(1,1) = 0;
event.current_sound(1,1) = 0; 
event.notification_sound(1,1) =  0;

% User events
userevent.typing(1,1)=0;
userevent.social_app_running(1,1)=0;
userevent.phone_is_moved(1,1)=0;
phone_is_used(1,1)=0;

% Distration state
distraction.display(1,1) = 0;
distraction.vibration(1,1) = 0;
distraction.noise(1,1) = 0;
distraction.message(1,1) = 0;

external_distraction_level(1,1) = 0;
sum_external_distraction_level(1,1)=0;

% Self regulatory model
attentional_control(1,1) = 1;
fatigue_level(1,1) = 0;
studying(1,1) = 1;
total_study_time=1;
personal_properties(1,1) = 0;
time_spend_studying(1,1) = 0;

% Agent choice model
goal_switching_probability(1,1) = 0;
taking_break(1,1) = 0;
total_break_time = 0;
optimal_goal_switching_level(1,1) = 0.5;
goal_switching_discrepancy(1,1) = 0;
early_break_discrepancy(1,1) = 0;
suggest_break_action(1,1) = 0;
suggest_laterbreak_action(1,1) = 0;
taking_suggest_break(1,1)=0;

% Parameters for sensor event scenario generation
display_activity=1;
vibration=2;
current_sound=3;
notification_sound=4;
noise_level=5;
nr_event= numel(fieldnames(event));
nr_distractions = numel(fieldnames(distraction));
eventmatrix=zeros(end_time,nr_event);
total_events=end_time;
time_period.display_activity=20;
time_period.vibration=20;
time_period.current_sound=20;
time_period.notification_sound=20;
reset.display_activity=0;
reset.vibration=0;
reset.current_sound=0;
reset.notification_sound=0;
social_value=5;  % between 1-10

list_time_period = [time_period.display_activity,time_period.vibration,time_period.current_sound,time_period.notification_sound];
list_reset = [reset.display_activity,reset.vibration,reset.current_sound,reset.notification_sound] ;  
randomm(1,1)=0;

%{
% Creating sensor events 
for x=1:total_events
    for z=1:length(list_time_period)
        randomm(x,z)= unifrnd(0,social_value);
        if ((x-list_reset(z))/(list_time_period(z))) >= randomm(x,z)
            eventmatrix(x,z)= 1;
        else eventmatrix(x,z)= 0;
        end
        if mod(x,list_time_period(z))==0
            list_reset(z)=list_reset(z)+(list_time_period(z))-1;
        end 
    end
end
%}

% Creating random sensor events
for z=1:nr_event
    for x=5:total_events
        eventmatrix(x,z)= (rand >= 0.9);
    end
end

% Simulation cycle
for i=1:end_time
    
    %% External distraction model
    
    % Event to distraction
    if event.display_activity(i,1)== 1 
       distraction.display(i+1,1) = 1/(nr_distractions);
    else distraction.display(i+1,1) = 0;
    end 
    if event.vibration(i,1)== 1
        distraction.vibration(i+1,1) = 1/(nr_distractions);
    else distraction.vibration(i+1,1) = 0;
    end
    if (event.current_sound(i,1) - background_soundlevel(1,1)) > background_soundlevel(1,1)
        event.noise_level(i,1) = 1;
    else event.noise_level(i,1) = 0;
    end
    if event.noise_level(i,1)== 1 || study_with_music(1,1)== 1 || event.notification_sound(i,1)==1
        distraction.noise(i+1,1) = 1/(nr_distractions);
    else distraction.noise(i+1,1) = 0;
    end
    if event.notification_sound(i,1)== 1
        distraction.message(i+1,1) = 1/(nr_distractions);
    else distraction.message(i+1,1) = 0;
    end
   
    % from distractions event to distraction level
    distraction.sum= distraction.display(i,1) + distraction.vibration(i,1) + distraction.noise(i,1) + distraction.message(i,1);
    external_distraction_level(i+1,1)= (distraction.sum);
    if external_distraction_level(i+1,1)>0 
        external_distraction_level(i+1,1)= external_distraction_level(i+1,1);
    end
 
    % allocating new events
    event.display_activity(i+1,1)=eventmatrix(i,display_activity);
    event.vibration(i+1,1)=eventmatrix(i,vibration);
    event.current_sound(i+1,1) = eventmatrix(i,current_sound);
    event.notification_sound(i+1,1) = eventmatrix(i,notification_sound);
    event.noise_level(i+1,1) = eventmatrix(i,noise_level);
    
    
    %% Attentional control model
    % Increase of fatigue during studying 
    taking_break(i+1,1)=taking_break(i,1);
    taking_suggest_break(i+1,1)=taking_suggest_break(i,1);
    
    if taking_break(i,1)==0;
        studying(i+1,1)=1;
        fatigue_level(i+1,1) = fatigue_level(i,1)+0.02;
        if fatigue_level(i,1)>1
            fatigue_level(i+1,1)=1;
        end    
    total_study_time = total_study_time+1;
    
    % Adjusting attentional control
    attentional_control(i+1,1)= attentional_control(i,1)-(fatigue_level(i,1)/50);
    if attentional_control(i+1,1)<0
        attentional_control(i+1,1)=0;
    end
    end
    
    %% Goal probability model
    
    goal_switching_discrepancy(i,1) = goal_switching_probability(i,1)- optimal_goal_switching_level(1,1);
    if goal_switching_discrepancy(i,1) < 0 
        early_break_discrepancy(i,1)=1;
    else early_break_discrepancy(i,1)=0;
    end
    if goal_switching_discrepancy(i,1) >= 0 && taking_break(i,1)==0;
        suggest_break_action(i,1)= 1;
    else suggest_break_action(i,1)= 0;
    end
    
    % determine start of break
    goal_switching_probability(i+1,1)=(1-attentional_control(i,1))* external_distraction_level(i,1);
    if taking_break(i,1)==0 && goal_switching_probability(i,1)>= (unifrnd(0,1))  
        if early_break_discrepancy(i,1)==1;
            suggest_laterbreak_action(i,1)=1;
        else suggest_laterbreak_action(i,1)=0;
        end 
        if suggest_laterbreak_action(i,1)==1 && ((unifrnd(0,1))>0.2)
            taking_break(i+1,1)=0;
        else taking_break(i+1,1)=1;
        end 
    end
    if suggest_break_action(i,1)== 1 %&& ((unifrnd(0,1))>0)
        taking_break(i+1,1)=1;
        taking_suggest_break(i+1,1)=1;
    end
    
    % Effect of taking break on fatigue and attentional control
    if taking_break(i,1)==1
        fatigue_level(i+1,1)= fatigue_level(i,1) - 0.015; 
        attentional_control(i+1,1)= attentional_control(i,1)+(fatigue_level(i,1)/50);
        total_break_time=total_break_time+1;
        studying(i+1,1)=0;
    end
    
    % determine end of break
    if taking_suggest_break(i,1)==1 && fatigue_level(i,1) < 0.5;
        taking_break(i+1,1)=0;
        taking_suggest_break(i+1,1)=0;
    end
    if taking_suggest_break(i,1)==0 && fatigue_level(i,1) <= unifrnd(0,1);
         taking_break(i+1,1)=0;
    end
   
end

% Output matrix
matrix_out= [external_distraction_level(:,1),fatigue_level(:,1),attentional_control(:,1),taking_break(:,1),goal_switching_probability(:,1)];
matrix_outgoal= taking_suggest_break(:,1);
%plotting
figure (1)
subplot(5,1,1)
plot(external_distraction_level(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('External distraction', 'FontSize',9);
title('External distraction')
axis([0 end_time 0 1])

subplot(5,1,2)
plot(fatigue_level(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('fatigue_level', 'FontSize',9);
title('Fatigue level')
axis([0 end_time 0 1.5])

subplot(5,1,3)
plot(attentional_control(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('attentional control', 'FontSize',9);
title('Attentional control')
axis([0 end_time 0 1.5])

subplot(5,1,4)
plot(taking_break(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('Taking break', 'FontSize',9);
title('Taking break')
axis([0 end_time 0 1.5])

subplot(5,1,5)
plot(goal_switching_probability(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('goal switching p', 'FontSize',9);
title('Goal switching probability')
axis([0 end_time 0 1])

figure (2)
subplot(2,1,1)
plot(suggest_laterbreak_action(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('suggest laterbreak action', 'FontSize',9);
title('suggest laterbreak action')
axis([0 end_time 0 1.5])

subplot(2,1,2)
plot(suggest_break_action(:,1))
xlabel('Time (min)','FontSize',9);
ylabel('suggest break action', 'FontSize',9);
title('suggest break action')
axis([0 end_time 0 1.5])

eventmatrix(:,6)= attentional_control(1:size(eventmatrix,1),1);
eventmatrix(:,7)= suggest_break_action(1:size(eventmatrix,1),1);
csvwrite('csvlist.csv',eventmatrix)
type csvlist.csv

sum(suggest_break_action(:,1) == 1);



