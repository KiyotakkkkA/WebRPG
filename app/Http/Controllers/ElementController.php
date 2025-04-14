<?php

namespace App\Http\Controllers;

use App\Models\Element;
use Illuminate\Http\Request;

class ElementController extends Controller
{
    /**
     * Получить список всех активных элементов
     */
    public function getElements()
    {
        $elements = Element::where('is_active', true)->get();

        return response()->json([
            'elements' => $elements
        ]);
    }

    /**
     * Получить конкретный элемент по ID
     */
    public function getElement($id)
    {
        $element = Element::findOrFail($id);

        return response()->json([
            'element' => $element
        ]);
    }
}
