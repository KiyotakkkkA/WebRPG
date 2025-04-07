import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicRoute from "./Routes/PublicRoute";
import PrivateRoute from "./Routes/PrivateRoute";
import AdminRoute from "./Routes/AdminRoute";
import Home from "./Pages/Home";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import CreateCharacter from "./Pages/Character/CreateCharacter";
import CharacterProfile from "./Pages/Character/CharacterProfile";
import GameInterface from "./Pages/Game/GameInterface";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminLocations from "./Pages/Admin/AdminLocations";
import AdminLocationConnections from "./Pages/Admin/AdminLocationConnections";
import AdminLocationRequirements from "./Pages/Admin/AdminLocationRequirements";

const MRouter: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <PublicRoute>
                            <Home />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/auth"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/character/create"
                    element={
                        <PrivateRoute>
                            <CreateCharacter />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/character/:id"
                    element={
                        <PrivateRoute>
                            <CharacterProfile />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/game"
                    element={
                        <PrivateRoute>
                            <GameInterface />
                        </PrivateRoute>
                    }
                />

                {/* Маршруты для админ-панели */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/locations"
                    element={
                        <AdminRoute>
                            <AdminLocations />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/location-connections"
                    element={
                        <AdminRoute>
                            <AdminLocationConnections />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/location-requirements"
                    element={
                        <AdminRoute>
                            <AdminLocationRequirements />
                        </AdminRoute>
                    }
                />
            </Routes>
        </Router>
    );
};

export default MRouter;
