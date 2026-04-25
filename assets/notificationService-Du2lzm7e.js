const m={ANNOUNCEMENT:"announcement"},f={scoring:{label:"Scoring Roster Reminder",icon:"Calendar",color:"blue",description:"Remind parents about scoring duties"},uniform:{label:"Uniform Information",icon:"Shirt",color:"purple",description:"Uniform orders, sizing, and collection"},announcement:{label:"Club Announcement",icon:"Megaphone",color:"green",description:"General club announcements"},game_day:{label:"Game Day Reminder",icon:"Trophy",color:"orange",description:"Game day information and reminders"},training_change:{label:"Training Schedule Change",icon:"Clock",color:"yellow",description:"Training time or venue changes"},event:{label:"Event/Social Announcement",icon:"PartyPopper",color:"pink",description:"Club events and social activities"},parent_invitation:{label:"Parent Invitation",icon:"UserPlus",color:"sky",description:"Invitation for parent to create an account"},parent_welcome:{label:"Parent Welcome",icon:"Heart",color:"green",description:"Welcome message for new parent accounts"},tryout_assessor_assignment:{label:"Tryout Assessor Assignment",icon:"ClipboardCheck",color:"violet",description:"Notification when assigned as a tryout assessor"}},c={NORMAL:"normal",URGENT:"urgent"},d={ALL:"all",AGE_GROUP:"age_group",TEAM:"team",INDIVIDUAL:"individual"},p={PENDING:"pending"},I={scoring:{subject:"Scoring Duty Reminder - {teamName} vs {opponent}",message:`Hi {parentName},

You're scheduled to score for {teamName} vs {opponent} on {gameDate} at {gameTime}.

Venue: {venue}

Please confirm your availability or request a swap if you're unable to attend.

Thank you for your support!

Emerald Lakers Basketball Club`},uniform:{subject:"Uniform Information - {teamName}",message:`Hi {parentName},

Uniform orders are now open for {teamName}.

Order Deadline: {deadline}
Collection: {collectionInfo}

Click the link below to order:
{shopUrl}

If you have any questions about sizing, please refer to the attached size guide or contact the club.

Emerald Lakers Basketball Club`},game_day:{subject:"Game Day Reminder - {teamName} vs {opponent}",message:`Hi {parentName},

This is a reminder that {playerName} has a game coming up:

{teamName} vs {opponent}
Date: {gameDate}
Time: {gameTime}
Venue: {venue}

Please ensure your player arrives 30 minutes before game time for warm-up.

Go Lakers!

Emerald Lakers Basketball Club`},training_change:{subject:"Training Schedule Change - {teamName}",message:`Hi {parentName},

Please note the following change to training for {teamName}:

{changeDetails}

If you have any questions, please contact your coach.

Emerald Lakers Basketball Club`},announcement:{subject:"Club Announcement - Emerald Lakers",message:`Hi everyone,

{announcementContent}

For more information, please contact the club or speak with your coach.

Emerald Lakers Basketball Club`},event:{subject:"Upcoming Event - {eventName}",message:`Hi everyone,

You're invited to our upcoming event:

Event: {eventName}
Date: {eventDate}
Time: {eventTime}
Location: {eventLocation}

{eventDetails}

Please RSVP by {rsvpDate} if required.

We look forward to seeing you there!

Emerald Lakers Basketball Club`},parent_invitation:{subject:"Parent Portal Invitation - Emerald Lakers",message:`Hi {parentName},

You've been invited to join the Emerald Lakers parent portal for {playerName}.

Use the link below to create your account:
{signupLink}

Or enter this code on the login page: {invitationCode}

This invitation expires on {expiresAt}.

Emerald Lakers Basketball Club`},parent_welcome:{subject:"Welcome to Emerald Lakers Parent Portal",message:`Hi {parentName},

Welcome to the Emerald Lakers Basketball Club parent portal!

You now have access to:
- Your child's skills progress and assessments
- Team schedules and game information
- Club notifications and announcements

Log in anytime at {loginUrl}

Thank you for being part of the Lakers family!

Emerald Lakers Basketball Club`},tryout_assessor_assignment:{subject:"Tryout Assessment Assignment - {sessionName}",message:`Hi {assessorName},

You have been assigned as an assessor for an upcoming tryout session:

Session: {sessionName}
Age Group: {ageGroup}
Date: {sessionDate}
Time: {sessionTime}
Venue: {venue}

Please log in to the Emerald Lakers app to view your assigned session and begin evaluations when the session is active.

Emerald Lakers Basketball Club`}},v=e=>{const n=new Date().toISOString();return{id:`notif_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,type:e.type||m.ANNOUNCEMENT,subject:e.subject||"",message:e.message||"",priority:e.priority||c.NORMAL,targetAudience:{type:e.audienceType||d.ALL,ageGroups:e.ageGroups||[],teamIds:e.teamIds||[],userIds:e.userIds||[]},attachments:e.attachments||[],scheduledFor:e.scheduledFor||null,sentAt:e.sendImmediately?n:null,status:e.sendImmediately?"sent":e.scheduledFor?"scheduled":"draft",createdBy:e.createdBy||"",createdAt:n,readBy:[],deletedBy:[]}},E=e=>{const n=new Date().toISOString();return{id:`score_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,gameId:e.gameId,teamId:e.teamId,parentId:e.parentId,parentName:e.parentName,parentEmail:e.parentEmail||"",gameDate:e.gameDate,opponent:e.opponent,venue:e.venue,status:p.PENDING,notificationSentAt:null,confirmedAt:null,swapRequests:[],createdAt:n,updatedAt:n}},A=(e,n)=>{let s=e;return Object.entries(n).forEach(([r,t])=>{const a=new RegExp(`\\{${r}\\}`,"g");s=s.replace(a,t||"")}),s},g=async(e,n,s,r)=>(console.log(`[EMAIL PLACEHOLDER] To: ${n}, Subject: ${s}`),{success:!1,message:"Email service not yet configured",queued:!0}),b=async(e,n,s)=>(console.log(`[SMS PLACEHOLDER] To: ${n}, Message: ${s.substring(0,50)}...`),{success:!1,message:"SMS service not yet configured",queued:!0}),y=()=>({notifications:{inApp:!0,email:!0,sms:!1,types:{scoring:!0,gameDay:!0,uniform:!0,announcements:!0,training:!0,events:!0}}}),h={PENDING:"pending"},T=e=>{const n=new Date().toISOString();return{id:`swap_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,assignmentId:e.assignmentId,gameId:e.gameId,gameName:e.gameName||"",gameDate:e.gameDate||"",requestingParentId:e.requestingParentId,requestingParentName:e.requestingParentName,targetParentId:e.targetParentId,targetParentName:e.targetParentName,reason:e.reason||"",status:h.PENDING,createdAt:n,updatedAt:n,respondedAt:null}},k=async(e,n)=>{var r;const s={inApp:0,email:0,sms:0,push:0,failed:0,details:[]};for(const t of n){const a=((r=t.preferences)==null?void 0:r.notifications)||y().notifications,i=a.types||{},l=e.type,u={scoring:"scoring",uniform:"uniform",announcement:"announcements",game_day:"gameDay",training_change:"training",event:"events"}[l]||"announcements";if(i[u]===!1){s.details.push({userId:t.id,status:"skipped",reason:"User disabled this notification type"});continue}if(a.inApp!==!1&&(s.inApp++,console.log(`[IN-APP] Notification sent to ${t.id}`)),a.email&&t.email){const o=await g(t.id,t.email,e.subject,e.message);(o.success||o.queued)&&s.email++}if(a.sms&&t.phone){const o=await b(t.id,t.phone,`${e.subject}: ${e.message.substring(0,100)}...`);(o.success||o.queued)&&s.sms++}s.details.push({userId:t.id,status:"sent",channels:{inApp:a.inApp!==!1,email:a.email&&!!t.email,sms:a.sms&&!!t.phone}})}return s};export{d as A,f as N,c as P,I as a,E as b,v as c,T as d,y as g,A as p,k as s};
