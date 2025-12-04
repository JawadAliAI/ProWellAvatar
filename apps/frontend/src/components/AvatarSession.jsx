import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./Scenario";
import { ChatInterface } from "./ChatInterface";
import ErrorBoundary from "./ErrorBoundary";

export default function AvatarSession() {
    return (
        <ErrorBoundary>
            <Loader />
            <Leva collapsed hidden />
            <Canvas
                shadows
                camera={{ position: [0, 0, 0], fov: 10 }}
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}
            >
                <Scenario />
            </Canvas>
            <ChatInterface />
        </ErrorBoundary>
    );
}
