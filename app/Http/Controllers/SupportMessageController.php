<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SupportMessageController extends Controller
{
    /**
     * Создать новый контроллер
     */
    public function __construct()
    {
        // Публичный доступ только к методу store
        $this->middleware('auth:sanctum')->except(['store', 'getUserMessages', 'rate']);

        // Для всех методов кроме store требуется роль admin или support
        $this->middleware('role:admin,support')->except(['store', 'getUserMessages', 'rate']);
    }

    /**
     * Показать список всех сообщений поддержки
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Получаем параметры фильтрации
        $status = $request->input('status');
        $type = $request->input('type');
        $archived = $request->input('archived', '0'); // По умолчанию показываем неархивированные сообщения

        // Запрос для получения сообщений с присоединением таблицы пользователей
        $query = SupportMessage::query()
            ->leftJoin('users as responders', 'support_messages.responder_id', '=', 'responders.id')
            ->select('support_messages.*', 'responders.name as responder_name');

        // Применяем фильтры если они указаны
        if ($status && $status !== 'all') {
            $query->where('support_messages.status', $status);
        }

        if ($type && $type !== 'all') {
            $query->where('support_messages.type', $type);
        }

        // Применяем фильтр по архивированию
        $query->where('support_messages.archived', $archived === '1');

        // Сортировка и пагинация
        $messages = $query->orderBy('support_messages.created_at', 'desc')
            ->paginate(20);

        return response()->json($messages);
    }

    /**
     * Создать новое обращение в поддержку
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Проверка входных данных
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'type' => 'required|string|in:question,bug,suggestion,account,other',
            'character_name' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Создаем сообщение
        $supportMessage = new SupportMessage();
        $supportMessage->name = $request->input('name');
        $supportMessage->email = $request->input('email');
        $supportMessage->type = $request->input('type');
        $supportMessage->character_name = $request->input('character_name');
        $supportMessage->message = $request->input('message');
        $supportMessage->status = 'new';

        // Если пользователь авторизован, привязываем сообщение к нему
        if (Auth::check()) {
            $supportMessage->user_id = Auth::id();
        }

        $supportMessage->save();

        return response()->json([
            'message' => 'Сообщение отправлено успешно',
            'support_message' => $supportMessage
        ], 201);
    }

    /**
     * Получить детали конкретного сообщения
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $message = SupportMessage::query()
            ->leftJoin('users as responders', 'support_messages.responder_id', '=', 'responders.id')
            ->select('support_messages.*', 'responders.name as responder_name')
            ->findOrFail($id);

        return response()->json($message);
    }

    /**
     * Обновить сообщение поддержки (ответить или изменить статус)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        // Проверка входных данных
        $validator = Validator::make($request->all(), [
            'response' => 'nullable|string',
            'status' => 'nullable|string|in:new,in_progress,closed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message = SupportMessage::findOrFail($id);
        $isChanged = false;

        // Обновляем ответ если он предоставлен
        if ($request->has('response')) {
            $message->response = $request->input('response');
            $isChanged = true;
        }

        // Обновляем статус если он предоставлен
        if ($request->has('status')) {
            $message->status = $request->input('status');
            $isChanged = true;
        }

        // Если были изменения, обновляем данные ответившего
        if ($isChanged) {
            $message->responder_id = Auth::id();
            // Если дата ответа еще не установлена или это первый ответ (новое сообщение -> в обработке)
            if (!$message->responded_at || $message->status === 'in_progress') {
                $message->responded_at = now();
            }
        }

        $message->save();

        // Получаем обновленное сообщение с именем ответившего
        $updatedMessage = SupportMessage::query()
            ->leftJoin('users as responders', 'support_messages.responder_id', '=', 'responders.id')
            ->select('support_messages.*', 'responders.name as responder_name')
            ->findOrFail($id);

        return response()->json([
            'message' => 'Сообщение обновлено',
            'support_message' => $updatedMessage
        ]);
    }

    /**
     * Получить статистику по сообщениям
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatistics()
    {
        $total = SupportMessage::count();
        $new = SupportMessage::where('status', 'new')->count();
        $inProgress = SupportMessage::where('status', 'in_progress')->count();
        $closed = SupportMessage::where('status', 'closed')->count();

        $byType = [
            'question' => SupportMessage::where('type', 'question')->count(),
            'bug' => SupportMessage::where('type', 'bug')->count(),
            'suggestion' => SupportMessage::where('type', 'suggestion')->count(),
            'account' => SupportMessage::where('type', 'account')->count(),
            'other' => SupportMessage::where('type', 'other')->count(),
        ];

        return response()->json([
            'total' => $total,
            'by_status' => [
                'new' => $new,
                'in_progress' => $inProgress,
                'closed' => $closed,
            ],
            'by_type' => $byType,
        ]);
    }

    /**
     * Получить сообщения текущего авторизованного пользователя
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserMessages()
    {
        // Проверяем, что пользователь авторизован
        if (!Auth::check()) {
            return response()->json([
                'error' => 'Необходима авторизация'
            ], 401);
        }

        // Получаем ID текущего пользователя
        $userId = Auth::id();

        // Запрашиваем сообщения, связанные с текущим пользователем
        $messages = SupportMessage::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'messages' => $messages
        ]);
    }

    /**
     * Взять сообщение на модерацию
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function takeForModeration($id)
    {
        $message = SupportMessage::findOrFail($id);

        // Проверяем, не взято ли сообщение другим модератором
        if ($message->on_moderation && $message->moderator_id !== Auth::id()) {
            return response()->json([
                'message' => 'Это сообщение уже взято на модерацию другим сотрудником',
            ], 403);
        }

        // Устанавливаем флаг модерации и ID текущего модератора
        $message->on_moderation = true;
        $message->moderator_id = Auth::id();
        $message->save();

        // Получаем обновленное сообщение с именем ответившего
        $updatedMessage = SupportMessage::query()
            ->leftJoin('users as responders', 'support_messages.responder_id', '=', 'responders.id')
            ->select('support_messages.*', 'responders.name as responder_name')
            ->findOrFail($id);

        return response()->json([
            'message' => 'Сообщение успешно взято на модерацию',
            'support_message' => $updatedMessage
        ]);
    }

    /**
     * Освободить сообщение от модерации
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function releaseFromModeration($id)
    {
        $message = SupportMessage::findOrFail($id);

        // Проверяем, взято ли сообщение текущим модератором
        if (!$message->on_moderation || $message->moderator_id !== Auth::id()) {
            return response()->json([
                'message' => 'Вы не можете освободить это сообщение от модерации',
            ], 403);
        }

        // Снимаем флаг модерации
        $message->on_moderation = false;
        $message->moderator_id = null;
        $message->save();

        // Получаем обновленное сообщение с именем ответившего
        $updatedMessage = SupportMessage::query()
            ->leftJoin('users as responders', 'support_messages.responder_id', '=', 'responders.id')
            ->select('support_messages.*', 'responders.name as responder_name')
            ->findOrFail($id);

        return response()->json([
            'message' => 'Сообщение успешно освобождено от модерации',
            'support_message' => $updatedMessage
        ]);
    }

    /**
     * Оценить ответ на сообщение поддержки и архивировать его
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function rate(Request $request, $id)
    {
        // Проверка входных данных
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'feedback_comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message = SupportMessage::findOrFail($id);

        // Проверяем, принадлежит ли сообщение текущему пользователю
        if (Auth::check() && $message->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Вы не можете оценить это сообщение'
            ], 403);
        }

        // Проверяем, не оценено ли сообщение уже
        if ($message->rating !== null) {
            return response()->json([
                'message' => 'Это сообщение уже было оценено'
            ], 422);
        }

        // Проверяем, закрыто ли сообщение
        if ($message->status !== 'closed') {
            return response()->json([
                'message' => 'Можно оценить только закрытые сообщения'
            ], 422);
        }

        // Сохраняем оценку
        $message->rating = $request->input('rating');
        $message->feedback_comment = $request->input('feedback_comment');
        $message->archived = true;
        $message->rated_at = now();
        $message->save();

        return response()->json([
            'message' => 'Спасибо за вашу оценку!',
            'support_message' => $message
        ]);
    }
}
