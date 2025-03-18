import { useState, useCallback } from "react";
import SidebarSection from "./SidebarSection";
import { Users, Building, MapPin } from "lucide-react";

const Entities = ({ namedEntities }) => {
  const [expandedEntityIds, setExpandedEntityIds] = useState([]);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  const groupedEntities = namedEntities.reduce((acc, entity) => {
    const category = entity.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entity);
    return acc;
  }, {});

  const toggleEntityDescription = (entityId) => {
    if (expandedEntityIds.includes(entityId)) {
      setExpandedEntityIds(expandedEntityIds.filter((id) => id !== entityId));
    } else {
      setExpandedEntityIds([...expandedEntityIds, entityId]);
    }
  };

  // Memoize the handleSectionToggle function
  const handleSectionToggle = useCallback((isOpen) => {
    setIsSectionOpen(isOpen);
    if (!isOpen) {
      setExpandedEntityIds([]);
    }
  }, []);

  return (
    <SidebarSection
      title="Entités Nommées"
      icon={Users}
      onToggle={handleSectionToggle}
    >
      {Object.entries(groupedEntities).map(([category, entities]) => (
        <div key={category} className="mb-3">
          <div className="flex items-center mb-1">
            {category === "person" && (
              <Users size={14} className="mr-1 text-primary/70" />
            )}
            {category === "organization" && (
              <Building size={14} className="mr-1 text-primary/70" />
            )}
            {category === "location" && (
              <MapPin size={14} className="mr-1 text-primary/70" />
            )}
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {category === "person"
                ? "Personnes"
                : category === "organization"
                ? "Organisations"
                : category === "location"
                ? "Lieux"
                : category}
            </div>
          </div>
          <div className="ml-1">
            {entities.map((entity) => (
              <div key={entity.id} className="mb-2">
                <div
                  className="px-2 py-1 text-sm hover:bg-muted/50 rounded cursor-pointer transition-colors"
                  onClick={() => toggleEntityDescription(entity.id)}
                >
                  {entity.name}
                </div>
                {expandedEntityIds.includes(entity.id) && (
                  <div className="ml-2 mt-1 px-3 py-2 text-xs bg-muted/30 rounded-md border-l-2 border-primary/30 animate-fade-in">
                    {entity.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </SidebarSection>
  );
};

export default Entities;
