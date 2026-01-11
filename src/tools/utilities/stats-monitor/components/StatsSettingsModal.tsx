import React from 'react';
import { Modal } from '@components/ui/Modal';
import { useStatsStore } from '../store/statsStore';
import { Switch } from '@components/ui/Switch';
import { Slider } from '@components/ui/Slider';
import { Monitor, Cpu, Activity, Battery, Thermometer, Wifi, Bluetooth as BluetoothIcon, Clock, Layers } from 'lucide-react';

interface StatsSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StatsSettingsModal: React.FC<StatsSettingsModalProps> = ({ isOpen, onClose }) => {
    const { enabledModules, preferences, toggleModule, updatePreferences } = useStatsStore();

    const modules = [
        { id: 'cpu', label: 'CPU Usage', icon: Cpu },
        { id: 'memory', label: 'Memory Usage', icon: Activity },
        { id: 'network', label: 'Network Traffic', icon: Wifi },
        { id: 'disk', label: 'Disk Activity', icon: Monitor },
        { id: 'gpu', label: 'GPU Usage', icon: Activity },
        { id: 'battery', label: 'Battery Info', icon: Battery },
        { id: 'sensors', label: 'Temperature Sensors', icon: Thermometer },
        { id: 'bluetooth', label: 'Bluetooth Devices', icon: BluetoothIcon },
        { id: 'timezones', label: 'World Clock', icon: Clock },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Stats Monitor Settings"
            size="md"
        >
            <div className="space-y-8">
                {/* Tray Settings */}
                <section>
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Layers size={14} />
                        Tray Integration
                    </h3>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Show in Menu Bar</p>
                                <p className="text-xs text-white/40 mt-1">Display CPU & RAM usage in the macOS tray</p>
                            </div>
                            <Switch
                                checked={preferences.showMenuBar}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreferences({ showMenuBar: e.target.checked })}
                            />
                        </div>
                    </div>
                </section>

                {/* Update Interval */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} />
                            Update Interval
                        </h3>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                            {preferences.updateInterval / 1000}s
                        </span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                        <div className="space-y-6">
                            <Slider
                                label="Refresh Frequency"
                                value={preferences.updateInterval}
                                min={500}
                                max={10000}
                                step={500}
                                onChange={(val: number) => updatePreferences({ updateInterval: val })}
                            />
                            <div className="flex justify-between text-[10px] text-white/20 font-medium px-1">
                                <span>0.5s</span>
                                <span>Fastest</span>
                                <span>Balanced</span>
                                <span>10s</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Enabled Modules */}
                <section>
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Monitor size={14} />
                        Visible Modules
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {modules.map((mod) => {
                            const Icon = mod.icon;
                            const isEnabled = enabledModules.includes(mod.id);
                            return (
                                <div
                                    key={mod.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-white/40'}`}>
                                            {mod.label}
                                        </span>
                                    </div>
                                    <Switch
                                        checked={isEnabled}
                                        onChange={() => toggleModule(mod.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </Modal>
    );
};
