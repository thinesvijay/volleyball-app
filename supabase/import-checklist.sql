-- Make Teams Pro Player Hub shadow import checklist.
-- Read-only validation queries for the Supabase SQL editor.

select 'app_users' as table_name, count(*) as rows from public.app_users
union all select 'player_profiles', count(*) from public.player_profiles
union all select 'club_teams', count(*) from public.club_teams
union all select 'team_profiles', count(*) from public.team_profiles
union all select 'access_requests', count(*) from public.access_requests
union all select 'team_members', count(*) from public.team_members
union all select 'team_membership_requests', count(*) from public.team_membership_requests
union all select 'team_needs', count(*) from public.team_needs
union all select 'team_need_interests', count(*) from public.team_need_interests
union all select 'tournaments', count(*) from public.tournaments
union all select 'tournament_events', count(*) from public.tournament_events
union all select 'tournament_availability', count(*) from public.tournament_availability
union all select 'tournament_squad_planning', count(*) from public.tournament_squad_planning
union all select 'roster_drafts', count(*) from public.roster_drafts
union all select 'roster_players', count(*) from public.roster_players
union all select 'official_rosters', count(*) from public.official_rosters
union all select 'event_comments', count(*) from public.event_comments
order by table_name;

select visibility, need_context, status, count(*) as rows
from public.team_needs
group by visibility, need_context, status
order by visibility, need_context, status;

select request_type, status, count(*) as rows
from public.access_requests
group by request_type, status
order by request_type, status;

select response_status, count(*) as rows
from public.tournament_availability
group by response_status
order by response_status;

select assigned_squad, planning_status, count(*) as rows
from public.tournament_squad_planning
group by assigned_squad, planning_status
order by assigned_squad, planning_status;

select roster_status, count(*) as rows
from public.roster_drafts
group by roster_status
order by roster_status;

select player_username, team_profile_id, count(*) as active_memberships
from public.team_members
where member_status = 'ACTIVE'
group by player_username, team_profile_id
having count(*) > 1;

select roster_id, player_username, count(*) as active_roster_rows
from public.roster_players
where player_status = 'ACTIVE'
group by roster_id, player_username
having count(*) > 1;

select legacy_plan_id, count(*) as comment_count
from public.event_comments
where active
group by legacy_plan_id
order by comment_count desc nulls last;
