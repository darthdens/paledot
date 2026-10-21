// KeyboardShortcuts - Handle keyboard navigation in Cosmos Explorer
import { useEffect } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';
import { celestialObjects } from '../data/celestialObjects';

export const KeyboardShortcuts = () => {
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setTimeSpeed = useCosmosStore(state => state.timeSpeed);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const planets = celestialObjects.filter(obj => 
        obj.type === 'planet' || obj.type === 'dwarf-planet'
      ).sort((a, b) => (a.orbitRadius || 0) - (b.orbitRadius || 0));
      
      switch (e.key) {
        // Number keys 1-9 for planets (+ 0 for Pluto)
        case '1':
          setSelectedObject(celestialObjects.find(o => o.id === 'mercury') || null);
          break;
        case '2':
          setSelectedObject(celestialObjects.find(o => o.id === 'venus') || null);
          break;
        case '3':
          setSelectedObject(celestialObjects.find(o => o.id === 'earth') || null);
          break;
        case '4':
          setSelectedObject(celestialObjects.find(o => o.id === 'mars') || null);
          break;
        case '5':
          setSelectedObject(celestialObjects.find(o => o.id === 'jupiter') || null);
          break;
        case '6':
          setSelectedObject(celestialObjects.find(o => o.id === 'saturn') || null);
          break;
        case '7':
          setSelectedObject(celestialObjects.find(o => o.id === 'uranus') || null);
          break;
        case '8':
          setSelectedObject(celestialObjects.find(o => o.id === 'neptune') || null);
          break;
        case '9':
          setSelectedObject(celestialObjects.find(o => o.id === 'pluto') || null);
          break;
        case '0':
          setSelectedObject(celestialObjects.find(o => o.id === 'sun') || null);
          break;
          
        // S for Sun
        case 's':
        case 'S':
          setSelectedObject(celestialObjects.find(o => o.id === 'sun') || null);
          break;
          
        // M for Moon
        case 'm':
        case 'M':
          setSelectedObject(celestialObjects.find(o => o.id === 'moon') || null);
          break;
          
        // Time controls
        case '+':
        case '=':
          useCosmosStore.getState().setTimeSpeed(Math.min(useCosmosStore.getState().timeSpeed * 2, 1000));
          break;
        case '-':
        case '_':
          useCosmosStore.getState().setTimeSpeed(Math.max(useCosmosStore.getState().timeSpeed / 2, 0.1));
          break;
        case ' ':
          // Space to pause/play
          const currentSpeed = useCosmosStore.getState().timeSpeed;
          if (currentSpeed === 0) {
            useCosmosStore.getState().setTimeSpeed(1);
          } else {
            useCosmosStore.getState().setTimeSpeed(0);
          }
          e.preventDefault();
          break;
          
        // Escape to deselect
        case 'Escape':
          setSelectedObject(null);
          break;
          
        // Arrow keys to cycle through planets
        case 'ArrowRight':
        case 'ArrowDown':
          if (selectedObject) {
            const currentIndex = planets.findIndex(p => p.id === selectedObject.id);
            if (currentIndex >= 0 && currentIndex < planets.length - 1) {
              setSelectedObject(planets[currentIndex + 1]!);
            } else if (currentIndex === -1) {
              setSelectedObject(planets[0]!);
            }
          } else {
            setSelectedObject(planets[0]!);
          }
          e.preventDefault();
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          if (selectedObject) {
            const currentIndex = planets.findIndex(p => p.id === selectedObject.id);
            if (currentIndex > 0) {
              setSelectedObject(planets[currentIndex - 1]!);
            }
          } else {
            setSelectedObject(planets[planets.length - 1]!);
          }
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedObject, selectedObject]);
  
  return null; // This is a non-visual component
};
