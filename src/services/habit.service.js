/**
 * Service: HabitService
 * Gestiona las operaciones CRUD exclusivas de la base de datos Supabase.
 */
import { authService } from './auth.service.js';

class HabitService {
  get client() {
    return authService.getSupabaseClient();
  }

  async fetchHabits() {
    const session = await authService.getSession();
    if (!session) return null;

    // Trae los hábitos y sus logs asociados
    const { data, error } = await this.client
      .from('habits')
      .select('*, habit_logs(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async insertHabit(name) {
    const session = await authService.getSession();
    if (!session) throw new Error('Usuario no autenticado');

    const { data, error } = await this.client
      .from('habits')
      .insert([{ user_id: session.user.id, name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHabit(habitId) {
    const { error } = await this.client
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) throw error;
  }

  async upsertLog(habitId, loggedDate, isCompleted) {
    const { data, error } = await this.client
      .from('habit_logs')
      .upsert(
        { habit_id: habitId, logged_date: loggedDate, is_completed: isCompleted },
        { onConflict: 'habit_id, logged_date' } 
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const habitService = new HabitService();