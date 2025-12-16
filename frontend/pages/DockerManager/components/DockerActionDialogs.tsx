import React from 'react';
import { FormDialog } from '../../../components/ui/Form';
import { Download, Plus, Database, Network } from 'lucide-react';
import { DockerService } from '../../../services/api';

// ==================== Pull Image ====================

interface PullImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PullImageDialog: React.FC<PullImageDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const handleSubmit = async (values: { repository: string; tag: string }) => {
        await DockerService.pullImage(values.repository, values.tag);
        onSuccess();
    };

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Pull Docker Image"
            titleIcon={<Download size={20} />}
            submitText="Pull Image"
            submitIcon={<Download size={16} />}
            fields={[
                {
                    name: 'repository',
                    label: 'Repository',
                    placeholder: 'e.g., nginx, redis, koukeneko/hashi',
                    required: true,
                    mono: true,
                },
                {
                    name: 'tag',
                    label: 'Tag',
                    placeholder: 'latest',
                    defaultValue: 'latest',
                    required: true,
                    mono: true,
                },
            ]}
        />
    );
};

// ==================== Create Network ====================

interface CreateNetworkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateNetworkDialog: React.FC<CreateNetworkDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const handleSubmit = async (values: { name: string; driver: string }) => {
        await DockerService.createNetwork(values.name, values.driver);
        onSuccess();
    };

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Create Network"
            titleIcon={<Network size={20} />}
            submitText="Create Network"
            submitIcon={<Plus size={16} />}
            fields={[
                {
                    name: 'name',
                    label: 'Network Name',
                    placeholder: 'my-network',
                    required: true,
                    mono: true,
                },
                {
                    name: 'driver',
                    label: 'Driver',
                    type: 'select',
                    options: [
                        { value: 'bridge', label: 'Bridge' },
                        { value: 'host', label: 'Host' },
                        { value: 'none', label: 'None' },
                        { value: 'macvlan', label: 'Macvlan' },
                        { value: 'ipvlan', label: 'Ipvlan' },
                    ],
                    defaultValue: 'bridge',
                    required: true,
                },
            ]}
        />
    );
};

// ==================== Create Volume ====================

interface CreateVolumeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateVolumeDialog: React.FC<CreateVolumeDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const handleSubmit = async (values: { name: string }) => {
        await DockerService.createVolume(values.name);
        onSuccess();
    };

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Create Volume"
            titleIcon={<Database size={20} />}
            submitText="Create Volume"
            submitIcon={<Plus size={16} />}
            fields={[
                {
                    name: 'name',
                    label: 'Volume Name',
                    placeholder: 'my-volume',
                    required: true,
                    mono: true,
                },
            ]}
        />
    );
};
